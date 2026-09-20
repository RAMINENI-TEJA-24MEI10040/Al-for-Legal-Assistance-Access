import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from app.db.database import db_manager
from app.security.auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    organization_name: str = "Enterprise Legal Corp"


@router.post("/login")
async def login(req: LoginRequest):
    users = await db_manager.execute_query(
        """
        SELECT u.id, u.email, u.hashed_password, u.organization_id, u.role_id, r.name as role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.email = ? AND u.is_active = 1
        """,
        (req.email,)
    )
    if not users or not verify_password(req.password, users[0]["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    user = users[0]
    token = create_access_token({
        "sub": user["id"],
        "org_id": user["organization_id"],
        "role": user["role_name"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "organization_id": user["organization_id"],
            "role": user["role_name"]
        }
    }


@router.post("/register")
async def register(req: RegisterRequest):
    existing = await db_manager.execute_query("SELECT id FROM users WHERE email = ?", (req.email,))
    if existing:
        raise HTTPException(status_code=400, detail="User email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pwd = get_password_hash(req.password)

    await db_manager.execute_commit(
        """
        INSERT INTO users (id, organization_id, role_id, email, hashed_password, full_name)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user_id, "org_default", "role_user", req.email, hashed_pwd, req.full_name)
    )

    token = create_access_token({
        "sub": user_id,
        "org_id": "org_default",
        "role": "End User"
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": req.email,
            "organization_id": "org_default",
            "role": "End User"
        }
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
