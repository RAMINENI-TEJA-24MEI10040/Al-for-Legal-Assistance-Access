import uuid
import asyncio
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, HTTPException
from app.security.auth import get_current_user
from app.security.tenant import TenantIsolationGuard
from app.security.file_validator import SecurityFileValidator
from app.services.document_service import DocumentService
from app.db.database import db_manager

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Security file verification (magic bytes, size, decompression, page limits)
    contents, file_type = await SecurityFileValidator.validate_file(file)

    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    org_id = current_user["organization_id"]
    user_id = current_user["id"]

    await db_manager.execute_commit(
        """
        INSERT INTO documents (id, organization_id, user_id, title, filename, file_type, file_size_bytes, mime_type, status, processing_stage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (doc_id, org_id, user_id, file.filename, file.filename, file_type, len(contents), file.content_type or "application/octet-stream", "queued", "Uploading")
    )

    # Trigger background 11-stage async processing pipeline
    background_tasks.add_task(
        DocumentService.process_document_pipeline,
        doc_id, contents, file_type, file.filename, org_id
    )

    return {
        "id": doc_id,
        "filename": file.filename,
        "file_type": file_type,
        "status": "queued",
        "processing_stage": "Uploading",
        "message": "Document upload accepted. Background processing initiated."
    }


@router.get("")
async def list_documents(current_user: dict = Depends(get_current_user)):
    docs = await db_manager.execute_query(
        """
        SELECT id, title, filename, file_type, file_size_bytes, page_count, status, processing_stage, created_at, updated_at
        FROM documents
        WHERE organization_id = ? AND is_deleted = 0
        ORDER BY created_at DESC
        """,
        (current_user["organization_id"],)
    )
    return docs


@router.get("/{document_id}")
async def get_document(document_id: str, current_user: dict = Depends(get_current_user)):
    doc = await TenantIsolationGuard.validate_document_access(document_id, current_user["organization_id"])
    return doc


@router.get("/{document_id}/sections")
async def get_document_sections(document_id: str, current_user: dict = Depends(get_current_user)):
    await TenantIsolationGuard.validate_document_access(document_id, current_user["organization_id"])
    sections = await db_manager.execute_query(
        "SELECT * FROM document_sections WHERE document_id = ? ORDER BY page_number ASC",
        (document_id,)
    )
    return sections


@router.get("/{document_id}/clauses")
async def get_document_clauses(document_id: str, current_user: dict = Depends(get_current_user)):
    await TenantIsolationGuard.validate_document_access(document_id, current_user["organization_id"])
    clauses = await db_manager.execute_query(
        "SELECT * FROM clauses WHERE document_id = ? AND organization_id = ?",
        (document_id, current_user["organization_id"])
    )
    return clauses


@router.delete("/{document_id}")
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    await TenantIsolationGuard.validate_document_access(document_id, current_user["organization_id"])
    await db_manager.execute_commit(
        "UPDATE documents SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (document_id,)
    )
    return {"message": "Document soft-deleted successfully", "id": document_id}
