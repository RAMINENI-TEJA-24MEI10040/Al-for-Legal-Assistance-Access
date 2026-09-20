from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.security.auth import get_current_user
from app.security.tenant import TenantIsolationGuard
from app.security.prompt_guard import PromptGuard
from app.agents.qa_agent import QAAgent

router = APIRouter(prefix="/questions", tags=["Q&A Engine"])


class QuestionRequest(BaseModel):
    query_text: str
    document_id: Optional[str] = None


@router.post("")
async def ask_question(req: QuestionRequest, current_user: dict = Depends(get_current_user)):
    # Inspect query for prompt injection
    is_injection, reason = PromptGuard.inspect_query(req.query_text)
    if is_injection:
        raise HTTPException(status_code=400, detail=reason)

    if req.document_id:
        await TenantIsolationGuard.validate_document_access(req.document_id, current_user["organization_id"])

    res = await QAAgent.answer_question(
        query_text=req.query_text,
        organization_id=current_user["organization_id"],
        user_id=current_user["id"],
        document_id=req.document_id
    )

    return res
