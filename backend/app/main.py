import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Timing & Latency Metrics Middleware
@app.middleware("http")
async def add_performance_metrics(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000
        metrics_collector.record_latency("api_http", duration_ms)
        metrics_collector.record_request(success=response.status_code < 400)
        response.headers["X-Process-Time-MS"] = f"{duration_ms:.2f}"
        return response
    except Exception as exc:
        duration_ms = (time.time() - start_time) * 1000
        metrics_collector.record_latency("api_http", duration_ms)
        metrics_collector.record_request(success=False)
        logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error. Exception logged securely."}
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


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "legal_disclaimer": settings.LEGAL_DISCLAIMER
    }
