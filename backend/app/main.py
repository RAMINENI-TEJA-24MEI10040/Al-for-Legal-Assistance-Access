import time
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.core.metrics import metrics_collector
from app.db.database import db_manager

from app.api.v1.auth import router as auth_router
from app.api.v1.documents import router as documents_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.comparison import router as comparison_router
from app.api.v1.questions import router as questions_router
from app.api.v1.lawyer_brief import router as lawyer_brief_router
from app.api.v1.exports import router as exports_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.problem_alignment import router as problem_alignment_router


# Simple in-memory token bucket rate limiter (100 req / minute per client IP)
rate_limit_store = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 100


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing LegalEase AI Backend Service...")
    await db_manager.init_db()
    yield
    logger.info("Shutting down LegalEase AI Backend Service.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-Grade GenAI-Powered Legal Document Intelligence Platform",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# GZip Compression Middleware (Compresses responses > 500 bytes for efficiency)
app.add_middleware(GZipMiddleware, minimum_size=500)

# Restricted CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Tenant-ID"],
)


# OWASP Security Headers & Rate Limiting Middleware
@app.middleware("http")
async def security_and_performance_middleware(request: Request, call_next):
    start_time = time.time()
    
    # 1. Rate Limiting Check
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    # Filter timestamps outside window
    rate_limit_store[client_ip] = [ts for ts in rate_limit_store[client_ip] if now - ts < RATE_LIMIT_WINDOW]
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Too many requests. Please slow down.", "type": "https://errors.legalease.ai/rate-limit"}
        )
    rate_limit_store[client_ip].append(now)

    try:
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000
        metrics_collector.record_latency("api_http", duration_ms)
        metrics_collector.record_request(success=response.status_code < 400)
        
        # 2. Add OWASP Security Headers & Performance Headers
        response.headers["X-Process-Time-MS"] = f"{duration_ms:.2f}"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        
        return response
    except Exception as exc:
        duration_ms = (time.time() - start_time) * 1000
        metrics_collector.record_latency("api_http", duration_ms)
        metrics_collector.record_request(success=False)
        logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "type": "https://errors.legalease.ai/internal-server-error",
                "title": "Internal Server Error",
                "status": 500,
                "detail": "An unexpected server error occurred. It has been securely logged."
            }
        )


# Include API V1 Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(analysis_router, prefix=settings.API_V1_STR)
app.include_router(comparison_router, prefix=settings.API_V1_STR)
app.include_router(questions_router, prefix=settings.API_V1_STR)
app.include_router(lawyer_brief_router, prefix=settings.API_V1_STR)
app.include_router(exports_router, prefix=settings.API_V1_STR)
app.include_router(metrics_router, prefix=settings.API_V1_STR)
app.include_router(problem_alignment_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "legal_disclaimer": settings.LEGAL_DISCLAIMER
    }

