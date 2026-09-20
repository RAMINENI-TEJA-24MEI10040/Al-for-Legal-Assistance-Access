from fastapi import APIRouter, Depends
from app.security.auth import get_current_user
from app.security.rbac import require_admin
from app.core.metrics import metrics_collector

router = APIRouter(prefix="/metrics", tags=["Observability & Metrics"])


@router.get("")
async def get_system_metrics(current_user: dict = Depends(require_admin)):
    summary = metrics_collector.get_summary()
    return summary
