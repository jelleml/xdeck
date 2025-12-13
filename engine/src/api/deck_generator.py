"""
Sales Deck Generator
Generates 5-slide sales decks using OpenAI GPT-4
"""

import json
import logging
import os

from fastapi import APIRouter
from fastapi import HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel
from pydantic import Field

router = APIRouter(prefix="/decks", tags=["decks"])
logger = logging.getLogger(__name__)

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = "gpt-4o-mini"
REQUIRED_SLIDES = 5  # Number of slides required for a complete deck


class DeckGenerationRequest(BaseModel):
    """Request model for deck generation"""

    markdown: str = Field(
        ...,
        description="Markdown content from the CLIENT's landing page (company you're selling TO)",
    )
    company_name: str | None = Field(
        None, description="Name of YOUR company (the service provider)"
    )
    company_description: str | None = Field(
        None, description="Description of YOUR company (the service provider)"
    )
    product_description: str | None = Field(
        None, description="Description of YOUR product/service being offered"
    )
    service_description: str | None = Field(
        None, description="Description of YOUR services provided"
    )


class SlideModel(BaseModel):
    """Model for a single slide"""

    slide_number: int = Field(..., description="Slide number (1-5)")
    title: str = Field(..., description="Slide title")
    content: str = Field(..., description="Slide content in markdown format")


class DeckGenerationResponse(BaseModel):
    """Response model for deck generation"""

    slides: list[SlideModel] = Field(..., description="List of generated slides")
    success: bool = Field(..., description="Whether generation was successful")
    error: str | None = Field(None, description="Error message if generation failed")


def build_prompt(
    markdown: str,
    company_name: str | None,
    company_description: str | None,
    product_description: str | None,
    service_description: str | None,
) -> str:
    """Build the prompt for OpenAI"""
    provider_info = []

    if company_name:
        provider_info.append(f"Company Name: {company_name}")
    if company_description:
        provider_info.append(f"Company Description: {company_description}")
    if product_description:
        provider_info.append(f"Product/Service Offering: {product_description}")
    if service_description:
        provider_info.append(f"Service Details: {service_description}")

    provider_context = (
        "\n".join(provider_info)
        if provider_info
        else "No provider information provided - use generic positioning."
    )

    return f"""You are a sales deck expert. Create a professional 5-slide sales deck to pitch \
YOUR services to a POTENTIAL CLIENT.

YOUR COMPANY INFORMATION (Service Provider - WHO is selling):
{provider_context}

TARGET CLIENT INFORMATION (from their website - WHO you're selling TO):
{markdown}

Your task is to create a compelling sales deck that YOU (the service provider) can use to \
pitch YOUR services to THIS specific client/prospect.

Generate exactly 5 slides with the following structure:
1. Title Slide - Opening headline showing you understand their business + your value proposition
2. Problem Slide - Specific pain points/challenges THIS CLIENT likely faces \
(based on their industry/business)
3. Solution Slide - How YOUR product/service solves THEIR specific problems
4. Benefits Slide - Key advantages and outcomes THEY will get from working with YOU
5. CTA Slide - Clear call-to-action for THIS CLIENT (demo, consultation, trial, meeting, etc.)

IMPORTANT GUIDELINES:
- Analyze the CLIENT's website to understand THEIR business, industry, and challenges
- The deck is FROM you (service provider) TO them (the client/prospect)
- Personalize the deck based on THEIR specific industry and business model
- Show how YOUR services solve THEIR problems
- Make it client-focused: what's in it for THEM?
- Be specific - reference their industry, business type, or challenges you observed
- If provider info is limited, focus on generic value propositions that fit their business

FORMATTING RULES:
- Return ONLY valid JSON, no markdown code blocks or extra text
- Each slide must have: slide_number (1-5), title (short, punchy), content (markdown format)
- Use markdown formatting for content: **bold**, bullet points (- or *), numbered lists
- Keep content concise and impactful (3-5 bullet points per slide max)
- Make the CTA specific and actionable for the client

Return JSON in this exact format:
{{
  "slides": [
    {{
      "slide_number": 1,
      "title": "Title Here",
      "content": "Markdown content here"
    }},
    ...
  ]
}}"""


@router.post("/generate", response_model=DeckGenerationResponse)
async def generate_deck(request: DeckGenerationRequest) -> DeckGenerationResponse:
    """
    Generate a 5-slide sales deck using OpenAI

    Args:
        request: DeckGenerationRequest with markdown and company info

    Returns:
        DeckGenerationResponse with generated slides

    Raises:
        HTTPException: If OpenAI API key is missing or request fails
    """
    if not OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY not found in environment variables")
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    logger.info("Generating deck with %d chars of markdown content", len(request.markdown))

    try:
        # Initialize OpenAI client
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)

        # Build prompt
        prompt = build_prompt(
            request.markdown,
            request.company_name,
            request.company_description,
            request.product_description,
            request.service_description,
        )

        # Debug: Log the full prompt being sent to OpenAI
        logger.info("=" * 80)
        logger.info("FULL PROMPT BEING SENT TO OPENAI:")
        logger.info("=" * 80)
        logger.info("%s", prompt)
        logger.info("=" * 80)
        logger.info("Provider info - company name: %s", request.company_name)
        logger.info("Provider info - company description: %s", request.company_description)
        logger.info("Provider info - product: %s", request.product_description)
        logger.info("Provider info - service: %s", request.service_description)
        logger.info("Client markdown length: %d chars", len(request.markdown))
        logger.info("=" * 80)

        # Call OpenAI API using the official SDK
        system_message = (
            "You are a sales deck expert. You return ONLY valid JSON responses, "
            "no markdown formatting or extra text."
        )
        completion = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
            timeout=90.0,
        )

        # Extract content from response
        content = completion.choices[0].message.content

        if not content:
            logger.error("No content in OpenAI response")
            return DeckGenerationResponse(slides=[], success=False, error="No content generated")

        # Parse JSON response
        slides_data = json.loads(content)
        slides = slides_data.get("slides", [])

        if not slides or len(slides) != REQUIRED_SLIDES:
            logger.error("Invalid number of slides generated: %d", len(slides))
            return DeckGenerationResponse(
                slides=[],
                success=False,
                error=f"Expected {REQUIRED_SLIDES} slides, got {len(slides)}",
            )

        # Validate and create slide models
        slide_models = [
            SlideModel(
                slide_number=slide.get("slide_number", idx + 1),
                title=slide.get("title", ""),
                content=slide.get("content", ""),
            )
            for idx, slide in enumerate(slides)
        ]

        logger.info("Successfully generated %d slides", len(slide_models))
        return DeckGenerationResponse(slides=slide_models, success=True, error=None)

    except TimeoutError as e:
        logger.exception("Timeout while generating deck")
        raise HTTPException(status_code=408, detail="Request timeout while generating deck") from e
    except json.JSONDecodeError as e:
        logger.exception("Failed to parse OpenAI response as JSON")
        raise HTTPException(status_code=500, detail="Invalid JSON response from OpenAI") from e
    except Exception as e:
        logger.exception("Unexpected error while generating deck")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e!s}") from e
