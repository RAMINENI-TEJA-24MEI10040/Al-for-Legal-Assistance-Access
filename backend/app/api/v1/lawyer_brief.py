from fastapi import APIRouter, Depends
from app.security.auth import get_current_user
from app.security.tenant import TenantIsolationGuard
from app.services.lawyer_brief_service import LawyerBriefService

router = APIRouter(prefix="/lawyer-brief", tags=["Lawyer Brief"])


@router.get("/{document_id}")
async def get_lawyer_brief(document_id: str, current_user: dict = Depends(get_current_user)):
    await TenantIsolationGuard.validate_document_access(document_id, current_user["organization_id"])
    brief = await LawyerBriefService.generate_brief(document_id, current_user["organization_id"])
    return brief
