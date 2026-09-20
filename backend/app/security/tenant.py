from fastapi import HTTPException, status
from app.db.database import db_manager


class TenantIsolationGuard:
    """Enforces multi-tenant data boundaries preventing IDOR and cross-tenant resource leakage."""

    @staticmethod
    async def validate_document_access(document_id: str, organization_id: str) -> dict:
        docs = await db_manager.execute_query(
            "SELECT * FROM documents WHERE id = ? AND organization_id = ? AND is_deleted = 0",
            (document_id, organization_id)
        )
        if not docs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or access denied for your organization."
            )
        return docs[0]

    @staticmethod
    def enforce_query_filter(base_sql: str, org_id: str) -> tuple[str, list]:
        """Appends tenant boundary condition to any raw SQL query."""
        if "WHERE" in base_sql.upper():
            sql = f"{base_sql} AND organization_id = ?"
        else:
            sql = f"{base_sql} WHERE organization_id = ?"
        return sql, [org_id]
