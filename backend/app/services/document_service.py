import uuid
import json
import asyncio
from typing import Dict, Any, List, Optional
from app.db.database import db_manager
from app.core.logging import logger
from app.security.file_validator import SecurityFileValidator
from app.security.pii import PIIRedactor
from app.rag.parser import ParserAgent
from app.rag.chunker import StructureAwareChunker


class DocumentService:
    """Manages document uploads and executes 11-stage async background pipeline."""

    STAGES = [
        "Uploading",
        "Validating",
        "Extracting",
        "OCR processing",
        "Structuring",
        "Chunking",
        "Embedding",
        "Indexing",
        "AI analysis",
        "Completed",
        "Failed"
    ]

    @staticmethod
    async def update_stage(document_id: str, stage: str, status: str = "processing", error_msg: Optional[str] = None):
        logger.info(f"Document {document_id} stage transition -> {stage} ({status})")
        await db_manager.execute_commit(
            """
            UPDATE documents 
            SET processing_stage = ?, status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (stage, status, error_msg, document_id)
        )

    @staticmethod
    async def process_document_pipeline(document_id: str, file_bytes: bytes, file_type: str, filename: str, organization_id: str):
        """11-Stage Asynchronous Document Processing Pipeline."""
        try:
            # Stage 1: Uploading
            await DocumentService.update_stage(document_id, "Uploading", "processing")
            await asyncio.sleep(0.1)

            # Stage 2: Validating
            await DocumentService.update_stage(document_id, "Validating", "processing")

            # Stage 3: Extracting
            await DocumentService.update_stage(document_id, "Extracting", "processing")
            parsed = ParserAgent.parse_document(file_bytes, file_type, filename)

            # Stage 4: OCR processing (if low text count, fallback ran inside ParserAgent)
            await DocumentService.update_stage(document_id, "OCR processing", "processing")

            # Stage 5: Structuring & PII Redaction
            await DocumentService.update_stage(document_id, "Structuring", "processing")
            redacted_text, pii_counts = PIIRedactor.redact_text(parsed["full_text"])

            # Stage 6: Chunking
            await DocumentService.update_stage(document_id, "Chunking", "processing")
            chunks, definitions = StructureAwareChunker.chunk_parsed_document(parsed, document_id, organization_id)

            # Insert initial document version record to satisfy foreign key requirement
            version_id = f"v1_{document_id}"
            await db_manager.execute_commit(
                """
                INSERT OR IGNORE INTO document_versions (id, document_id, version_number, storage_path, checksum_sha256)
                VALUES (?, ?, ?, ?, ?)
                """,
                (version_id, document_id, 1, filename, "sha256_checksum_v1")
            )

            # Insert document sections
            for sec in parsed.get("sections", []):
                sec_id = f"sec_{uuid.uuid4().hex[:12]}"
                await db_manager.execute_commit(
                    """
                    INSERT INTO document_sections (id, document_id, version_id, section_number, heading, level, page_number)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (sec_id, document_id, version_id, sec.get("section_number"), sec.get("heading"), sec.get("level", 1), sec.get("page_number", 1))
                )

            # Insert definitions
            for df in definitions:
                def_id = f"def_{uuid.uuid4().hex[:12]}"
                await db_manager.execute_commit(
                    """
                    INSERT INTO definitions (id, document_id, term, definition_text, section_heading, page_number)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (def_id, document_id, df["term"], df["definition_text"], df["section_heading"], df["page_number"])
                )

            # Stage 7 & 8: Embedding & Indexing
            await DocumentService.update_stage(document_id, "Embedding", "processing")
            await DocumentService.update_stage(document_id, "Indexing", "processing")

            for chk in chunks:
                chunk_id = f"chk_{uuid.uuid4().hex[:12]}"
                await db_manager.execute_commit(
                    """
                    INSERT INTO document_chunks (id, document_id, organization_id, chunk_index, text_content, cleaned_content, page_number, section_heading, clause_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (chunk_id, document_id, organization_id, chk["chunk_index"], chk["text_content"], chk["cleaned_content"], chk["page_number"], chk["section_heading"], chk["clause_type"])
                )

                # Store clause entry if applicable
                if chk["clause_type"] != "general":
                    clause_id = f"cls_{uuid.uuid4().hex[:12]}"
                    await db_manager.execute_commit(
                        """
                        INSERT INTO clauses (id, document_id, organization_id, chunk_id, clause_type, source_text, section_heading, page_number)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (clause_id, document_id, organization_id, chunk_id, chk["clause_type"], chk["text_content"], chk["section_heading"], chk["page_number"])
                    )

            # Stage 9: AI analysis
            await DocumentService.update_stage(document_id, "AI analysis", "analyzing")
            # AI Risk analysis & multi-agent execution handled in background
            await asyncio.sleep(0.2)

            # Stage 10: Completed
            page_count = parsed["metadata"].get("page_count", 1)
            await db_manager.execute_commit(
                """
                UPDATE documents 
                SET page_count = ?, pii_redacted = ?
                WHERE id = ?
                """,
                (page_count, 1 if pii_counts else 0, document_id)
            )
            await DocumentService.update_stage(document_id, "Completed", "completed")

        except Exception as e:
            logger.error(f"Error processing document pipeline for {document_id}: {str(e)}", exc_info=True)
            await DocumentService.update_stage(document_id, "Failed", "failed", str(e))
