from typing import List
from fastapi import Depends, HTTPException, status
from app.security.auth import get_current_user


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {', '.join(self.allowed_roles)}"
            )
        return current_user


require_admin = RoleChecker(["Admin"])
require_legal_professional = RoleChecker(["Admin", "Legal Professional"])
require_standard_user = RoleChecker(["Admin", "Legal Professional", "End User"])
require_auditor = RoleChecker(["Admin", "Auditor"])
