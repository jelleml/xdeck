"""
Firecrawl API Integration
Crawls websites and returns markdown content
"""

import logging
import os

from fastapi import APIRouter
from fastapi import HTTPException
from firecrawl import Firecrawl
from pydantic import BaseModel
from pydantic import Field

router = APIRouter(prefix="/firecrawl", tags=["firecrawl"])
logger = logging.getLogger(__name__)

# Configuration
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")


class CrawlRequest(BaseModel):
    """Request model for website crawling"""

    domain: str = Field(..., description="Domain to crawl (e.g., 'example.com')")


class CrawlResponse(BaseModel):
    """Response model for crawling results"""

    markdown: str = Field(..., description="Markdown content of the page")
    success: bool = Field(..., description="Whether crawling was successful")
    error: str | None = Field(None, description="Error message if crawling failed")


@router.post("/crawl", response_model=CrawlResponse)
async def crawl_website(request: CrawlRequest) -> CrawlResponse:
    """
    Crawl a website and return its markdown content

    Args:
        request: CrawlRequest with domain to crawl

    Returns:
        CrawlResponse with markdown content

    Raises:
        HTTPException: If Firecrawl API key is missing or request fails
    """
    if not FIRECRAWL_API_KEY:
        logger.error("FIRECRAWL_API_KEY not found in environment variables")
        raise HTTPException(status_code=500, detail="Firecrawl API key not configured")

    # Ensure domain has https:// prefix
    domain = request.domain
    if not domain.startswith(("http://", "https://")):
        domain = f"https://{domain}"

    logger.info("Crawling domain: %s", domain)

    try:
        # Initialize Firecrawl client
        firecrawl = Firecrawl(api_key=FIRECRAWL_API_KEY)

        # Scrape the website using the official SDK
        result = firecrawl.scrape(url=domain, formats=["markdown"])

        # Extract markdown from Document object (Pydantic model)
        markdown = result.markdown if hasattr(result, "markdown") else ""

        if not markdown:
            logger.warning("No markdown content found for domain: %s", domain)
            return CrawlResponse(markdown="", success=False, error="No content found on the page")

        logger.info("Successfully crawled domain: %s (content length: %d)", domain, len(markdown))
        return CrawlResponse(markdown=markdown, success=True, error=None)

    except TimeoutError as e:
        logger.exception("Timeout while crawling domain: %s", domain)
        raise HTTPException(status_code=408, detail="Request timeout while crawling website") from e
    except Exception as e:
        logger.exception("Unexpected error while crawling domain: %s", domain)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e!s}") from e
