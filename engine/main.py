import os
from datetime import UTC
from datetime import datetime

import sentry_sdk
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from pydantic import Field
from sentry_sdk.integrations.fastapi import FastApiIntegration

from src.api.currency import router as currency_router
from src.api.deck_generator import router as deck_generator_router
from src.api.firecrawl import router as firecrawl_router
from src.api.pdf_export import router as pdf_export_router


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str = Field(..., description="Service health status")
    service: str = Field(..., description="Service name")
    timestamp: str = Field(..., description="Response timestamp")


load_dotenv()

# Initialize Sentry with FastAPI integration
sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=os.getenv("ENVIRONMENT", "development"),
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        enable_tracing=True,
        integrations=[
            FastApiIntegration(
                transaction_style="endpoint",
            ),
        ],
    )

app = FastAPI(
    title="Engine Service", description="Core engine service for Kosuke Template", version="1.0.0"
)

# Include routers
app.include_router(currency_router)
app.include_router(firecrawl_router, prefix="/api/v1")
app.include_router(deck_generator_router, prefix="/api/v1")
app.include_router(pdf_export_router, prefix="/api/v1")


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint for monitoring."""
    return HealthResponse(
        status="healthy", service="engine-service", timestamp=datetime.now(UTC).isoformat()
    )


@app.get("/")
async def root() -> dict[str, str | dict[str, str]]:
    """Root endpoint with API information."""
    return {
        "message": "Engine Service API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "convert": "/convert",
            "firecrawl": "/api/v1/firecrawl/crawl",
            "deck_generator": "/api/v1/decks/generate",
            "pdf_export": "/api/v1/pdf/export",
            "docs": "/docs",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)  # noqa: S104
