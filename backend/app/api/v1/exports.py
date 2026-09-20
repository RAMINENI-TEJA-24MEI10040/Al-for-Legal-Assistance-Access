import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.security.auth import get_current_user
from app.security.tenant import TenantIsolationGuard
from app.services.export_service import ExportService
from app.db.database import db_manager

router = APIRouter(prefix="/exports", tags=["Exports"])


class ExportRequest(BaseModel):
    document_id: str
    export_format: str = "pdf" # pdf, excel, ics, email_draft


@router.post("")
async def create_export(req: ExportRequest, current_user: dict = Depends(get_current_user)):
    await TenantIsolationGuard.validate_document_access(req.document_id, current_user["organization_id"])
    res = await ExportService.generate_export(
        document_id=req.document_id,
        export_format=req.export_format,
        organization_id=current_user["organization_id"],
        user_id=current_user["id"]
    )
    return res


@router.get("/download/{export_id}")
async def download_export(export_id: str, current_user: dict = Depends(get_current_user)):
    rows = await db_manager.execute_query(
        "SELECT * FROM exports WHERE id = ? AND organization_id = ?",
        (export_id, current_user["organization_id"])
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Export file not found or unauthorized.")

    export_rec = rows[0]
    file_path = export_rec["file_path"]

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Export file missing on server disk.")

    return FileResponse(
        path=file_path,
        filename=os.path.basename(file_path),
        media_type="application/octet-stream"
    )
