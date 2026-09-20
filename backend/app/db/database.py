import os
import hashlib
import aiosqlite
import sqlite3
from typing import AsyncGenerator, List, Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger


def _hash_seed_password(password: str) -> str:
    salt = "legalease_enterprise_salt_2026"
    pwd_bytes = password.encode('utf-8')
    salt_bytes = salt.encode('utf-8')
    key = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt_bytes, 100000)
    return key.hex()


class DatabaseManager:
    """Async SQLite Database Manager enforcing WAL mode, 64MB cache, mmap, and foreign key constraints."""

    def __init__(self, db_path: str = settings.DATABASE_PATH):
        self.db_path = db_path

    async def get_db(self) -> AsyncGenerator[aiosqlite.Connection, None]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            await db.execute("PRAGMA foreign_keys = ON;")
            await db.execute("PRAGMA journal_mode = WAL;")
            await db.execute("PRAGMA synchronous = NORMAL;")
            await db.execute("PRAGMA cache_size = -64000;")
            await db.execute("PRAGMA temp_store = MEMORY;")
            yield db

    async def execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            await db.execute("PRAGMA foreign_keys = ON;")
            await db.execute("PRAGMA journal_mode = WAL;")
            await db.execute("PRAGMA synchronous = NORMAL;")
            async with db.execute(query, params) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def execute_commit(self, query: str, params: tuple = ()) -> int:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("PRAGMA foreign_keys = ON;")
            await db.execute("PRAGMA journal_mode = WAL;")
            await db.execute("PRAGMA synchronous = NORMAL;")
            cursor = await db.execute(query, params)
            await db.commit()
            return cursor.lastrowid or cursor.rowcount

    async def init_db(self):
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        if not os.path.exists(schema_path):
            logger.error(f"Schema file not found at {schema_path}")
            return

        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("PRAGMA journal_mode = WAL;")
            await db.execute("PRAGMA synchronous = NORMAL;")
            await db.execute("PRAGMA cache_size = -64000;")
            await db.execute("PRAGMA temp_store = MEMORY;")
            await db.execute("PRAGMA foreign_keys = ON;")
            await db.executescript(schema_sql)
            await db.commit()
            logger.info("SQLite schema initialized successfully in optimized WAL mode.")

        await self._seed_default_data()

    async def _seed_default_data(self):
        """Seeds standard enterprise organization, roles, permissions, and initial admin/legal accounts."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            
            cursor = await db.execute("SELECT id FROM organizations WHERE id = 'org_default'")
            org = await cursor.fetchone()
            if not org:
                await db.execute(
                    "INSERT INTO organizations (id, name, domain) VALUES (?, ?, ?)",
                    ("org_default", "Enterprise Legal Corp", "enterpriselegal.com")
                )
                
            roles = [
                ("role_admin", "Admin", "Full platform administration and access control"),
                ("role_legal", "Legal Professional", "Legal review, compliance audit, and brief generation"),
                ("role_user", "End User", "Standard document upload, simplification, and Q&A"),
                ("role_auditor", "Auditor", "Read-only access to audit logs and security compliance reports")
            ]
            for rid, rname, rdesc in roles:
                await db.execute(
                    "INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)",
                    (rid, rname, rdesc)
                )

            seed_password_hash = _hash_seed_password("Admin@123456")
            
            # Upsert admin user
            await db.execute(
                """
                INSERT INTO users (id, organization_id, role_id, email, hashed_password, full_name, mfa_enabled)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET hashed_password = excluded.hashed_password
                """,
                ("user_admin", "org_default", "role_admin", "admin@legalease.ai", seed_password_hash, "Enterprise Admin", 0)
            )

            # Upsert counsel user
            await db.execute(
                """
                INSERT INTO users (id, organization_id, role_id, email, hashed_password, full_name, mfa_enabled)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET hashed_password = excluded.hashed_password
                """,
                ("user_counsel", "org_default", "role_legal", "counsel@legalease.ai", seed_password_hash, "General Counsel", 0)
            )

            await db.commit()
            logger.info("Default organization, RBAC roles, and seed users initialized/updated.")



db_manager = DatabaseManager()
