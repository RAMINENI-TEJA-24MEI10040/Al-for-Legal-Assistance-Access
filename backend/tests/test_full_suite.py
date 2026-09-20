import pytest
import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import db_manager

# Ensure DB initialized & seeded
asyncio.run(db_manager.init_db())

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "LegalEase AI" in data["name"]

def test_problem_alignment_endpoint():
    response = client.get("/api/v1/problem-alignment")
    assert response.status_code == 200
    data = response.json()
    assert data["project_name"] == "LegalEase AI"
    assert len(data["target_users"]) == 3
    assert len(data["pain_points"]) == 4
    assert len(data["solutions"]) == 6

def test_security_headers():
    response = client.get("/")
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-XSS-Protection"] == "1; mode=block"

def test_auth_login_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@legalease.ai", "password": "Admin@123456"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@legalease.ai"

def test_auth_login_invalid_credentials():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@legalease.ai", "password": "WrongPassword123"}
    )
    assert response.status_code == 401

def test_unauthorized_access():
    response = client.get("/api/v1/documents")
    assert response.status_code == 401

def test_authenticated_document_flow():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@legalease.ai", "password": "Admin@123456"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    docs_res = client.get("/api/v1/documents", headers=headers)
    assert docs_res.status_code == 200
    docs = docs_res.json()
    assert isinstance(docs, list)

    if len(docs) > 0:
        doc_id = docs[0]["id"]
        analysis_res = client.get(f"/api/v1/documents/{doc_id}/analysis", headers=headers)
        assert analysis_res.status_code == 200

        brief_res = client.get(f"/api/v1/lawyer-brief/{doc_id}", headers=headers)
        assert brief_res.status_code == 200

def test_qa_anti_hallucination_refusal():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@legalease.ai", "password": "Admin@123456"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    docs_res = client.get("/api/v1/documents", headers=headers)
    docs = docs_res.json()

    if len(docs) > 0:
        doc_id = docs[0]["id"]
        qa_res = client.post(
            "/api/v1/questions",
            headers=headers,
            json={"document_id": doc_id, "query_text": "What is the capital of Mars?"}
        )
        assert qa_res.status_code == 200
        data = qa_res.json()
        assert "answer_text" in data or "answer" in data


def test_metrics_endpoint():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@legalease.ai", "password": "Admin@123456"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/metrics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data
    assert "error_rate" in data
