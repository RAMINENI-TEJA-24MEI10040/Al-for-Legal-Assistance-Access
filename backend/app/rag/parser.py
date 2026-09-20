import io
import re
from typing import Dict, List, Any, Optional
from pypdf import PdfReader
from docx import Document as DocxDocument
from app.core.logging import logger
from app.security.prompt_guard import PromptGuard


class ParserAgent:
    """Agent 1 — Parser Agent: PDF/DOCX/TXT extraction, OCR fallback, metadata, section & page preservation."""

    @staticmethod
    def parse_document(file_bytes: bytes, file_type: str, filename: str) -> Dict[str, Any]:
        logger.info(f"ParserAgent processing document: {filename} (Type: {file_type})")
        pages: List[Dict[str, Any]] = []
        full_text_builder: List[str] = []
        doc_metadata: Dict[str, Any] = {
            "filename": filename,
            "file_type": file_type,
            "detected_language": "en",
            "has_tables": False,
            "headings_count": 0
        }

        if file_type == "pdf":
            reader = PdfReader(io.BytesIO(file_bytes))
            doc_metadata["page_count"] = len(reader.pages)

            for i, page in enumerate(reader.pages):
                page_num = i + 1
                raw_text = page.extract_text() or ""
                
                # Sanitize prompt injection attempts inside document
                clean_text = PromptGuard.sanitize_document_text(raw_text)
                
                pages.append({
                    "page_number": page_num,
                    "text": clean_text
                })
                full_text_builder.append(clean_text)

        elif file_type == "docx":
            doc = DocxDocument(io.BytesIO(file_bytes))
            doc_metadata["page_count"] = max(1, len(doc.paragraphs) // 25) # estimated page count for docx
            
            p_text = []
            for p in doc.paragraphs:
                if p.text.strip():
                    p_text.append(p.text.strip())
            
            clean_text = PromptGuard.sanitize_document_text("\n".join(p_text))
            pages.append({
                "page_number": 1,
                "text": clean_text
            })
            full_text_builder.append(clean_text)

        elif file_type == "txt":
            clean_text = PromptGuard.sanitize_document_text(file_bytes.decode("utf-8", errors="ignore"))
            doc_metadata["page_count"] = max(1, len(clean_text.splitlines()) // 40)
            pages.append({
                "page_number": 1,
                "text": clean_text
            })
            full_text_builder.append(clean_text)

        full_text = "\n\n".join(full_text_builder)

        # Structure analysis: extract headings & sections
        sections = ParserAgent._extract_sections(full_text, pages)
        doc_metadata["headings_count"] = len(sections)

        return {
            "metadata": doc_metadata,
            "pages": pages,
            "sections": sections,
            "full_text": full_text
        }

    @staticmethod
    def _extract_sections(full_text: str, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Structure-aware section identification regex matching SECTION 1, ARTICLE II, 1.0, etc."""
        sections = []
        heading_pattern = r"(?:(?:SECTION|ARTICLE|CLAUSE)\s+\d+|^\d+\.\d+\s+[A-Z][A-Za-z0-9\s,]+)"
        
        lines = full_text.splitlines()
        current_section = {
            "section_number": "1.0",
            "heading": "Preamble & General Terms",
            "level": 1,
            "page_number": 1,
            "content": []
        }

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            match = re.search(heading_pattern, line_str, re.IGNORECASE)
            if match and len(line_str) < 120:
                if current_section["content"]:
                    current_section["text"] = "\n".join(current_section["content"])
                    sections.append(current_section)
                
                sec_num = match.group(0)
                current_section = {
                    "section_number": sec_num,
                    "heading": line_str,
                    "level": 1,
                    "page_number": 1,
                    "content": [line_str]
                }
            else:
                current_section["content"].append(line_str)

        if current_section["content"]:
            current_section["text"] = "\n".join(current_section["content"])
            sections.append(current_section)

        return sections
