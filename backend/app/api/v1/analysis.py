from fastapi import APIRouter, Depends
from app.security.auth import get_current_user
from app.security.tenant import TenantIsolationGuard
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/documents", tags=["Analysis"])


@router.get("/{document_id}/analysis")
async def get_document_analysis(document_id: str, current_user: dict = Depends(get_current_user)):
    await TenantIsolationGuard.validate_document_access(document_id, current_user["organization_id"])
    analysis = await AnalysisService.get_document_summary(document_id, current_user["organization_id"])
    return analysis
