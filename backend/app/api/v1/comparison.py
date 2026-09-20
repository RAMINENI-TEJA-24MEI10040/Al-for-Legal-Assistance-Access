from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.security.auth import get_current_user
from app.security.tenant import TenantIsolationGuard
from app.services.comparison_service import ComparisonService

router = APIRouter(prefix="/comparisons", tags=["Comparisons"])


class ComparisonRequest(BaseModel):
    document_id_a: str
    document_id_b: str


@router.post("")
async def compare_documents(req: ComparisonRequest, current_user: dict = Depends(get_current_user)):
    await TenantIsolationGuard.validate_document_access(req.document_id_a, current_user["organization_id"])
    await TenantIsolationGuard.validate_document_access(req.document_id_b, current_user["organization_id"])

    res = await ComparisonService.compare_documents(req.document_id_a, req.document_id_b, current_user["organization_id"])
    return res
