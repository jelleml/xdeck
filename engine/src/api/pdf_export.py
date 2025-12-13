"""
PDF Export API
Generate styled PDFs from deck slides using fpdf2 (pure Python, no system deps)
"""

import base64
import logging
import re

from fastapi import APIRouter
from fastapi import HTTPException
from fpdf import FPDF
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pdf", tags=["pdf"])

# Modern red color scheme
PRIMARY_RED = (220, 38, 38)  # #dc2626 - Vibrant red
ACCENT_RED = (239, 68, 68)  # #ef4444 - Lighter red for accents
TEXT_DARK = (23, 23, 23)  # #171717 - Near black
TEXT_MEDIUM = (64, 64, 64)  # #404040 - Medium gray
MUTED_GRAY = (115, 115, 115)  # #737373 - Muted gray
BACKGROUND_DARK = (250, 250, 250)  # #fafafa - Very light gray
BACKGROUND_GRADIENT_START = (255, 241, 242)  # #fff1f2 - Light red tint
BACKGROUND_GRADIENT_END = (254, 226, 226)  # #fee2e2 - Slightly darker red tint


class SlideData(BaseModel):
    """Single slide data"""

    slide_number: int
    title: str
    content: str


class PDFExportRequest(BaseModel):
    """Request to export deck as PDF"""

    deck_name: str
    slides: list[SlideData]


class PDFExportResponse(BaseModel):
    """Response with PDF data"""

    success: bool
    pdf_base64: str | None = None
    error: str | None = None


class DeckPDF(FPDF):
    """Custom PDF class for deck slides"""

    def __init__(self) -> None:
        # Landscape letter size (11in x 8.5in)
        super().__init__(orientation="L", unit="in", format="Letter")
        self.set_auto_page_break(auto=False)
        self.set_margins(0.8, 0.8, 0.8)

    def add_slide_page(self, slide_num: int, total_slides: int) -> None:
        """Add a new slide page with modern red gradient background"""
        self.add_page()

        # Modern gradient background (light to slightly darker red tint)
        gradient_steps = 40
        for i in range(gradient_steps):
            y = (8.5 / gradient_steps) * i
            height = 8.5 / gradient_steps + 0.01
            # Interpolate between gradient colors
            ratio = i / gradient_steps
            r_diff = BACKGROUND_GRADIENT_END[0] - BACKGROUND_GRADIENT_START[0]
            g_diff = BACKGROUND_GRADIENT_END[1] - BACKGROUND_GRADIENT_START[1]
            b_diff = BACKGROUND_GRADIENT_END[2] - BACKGROUND_GRADIENT_START[2]
            r = int(BACKGROUND_GRADIENT_START[0] + r_diff * ratio)
            g = int(BACKGROUND_GRADIENT_START[1] + g_diff * ratio)
            b = int(BACKGROUND_GRADIENT_START[2] + b_diff * ratio)
            self.set_fill_color(r, g, b)
            self.rect(0, y, 11, height, "F")

        # Modern red accent bar on left edge
        self.set_fill_color(*PRIMARY_RED)
        self.rect(0, 0, 0.05, 8.5, "F")

        # Subtle red accent bar on top
        self.set_fill_color(*ACCENT_RED)
        self.rect(0, 0, 11, 0.03, "F")

        # Modern slide number badge (bottom right corner)
        self.set_fill_color(*PRIMARY_RED)
        self.rect(9.8, 7.95, 1, 0.4, "F")

        self.set_font("Helvetica", "B", 11)
        self.set_text_color(255, 255, 255)  # White text
        self.set_xy(9.8, 8.05)
        self.cell(1, 0.2, f"{slide_num}/{total_slides}", align="C")


def parse_markdown_line(line: str) -> tuple[str, str]:  # noqa: PLR0911
    """
    Parse a markdown line and return (type, content)

    Args:
        line: Markdown line

    Returns:
        Tuple of (line_type, cleaned_content)
    """
    line = line.strip()

    if not line:
        return ("empty", "")

    # Headers
    if line.startswith("### "):
        return ("h3", line[4:])
    if line.startswith("## "):
        return ("h2", line[3:])
    if line.startswith("# "):
        return ("h1", line[2:])

    # Lists
    if line.startswith(("- ", "* ")):
        return ("bullet", line[2:])
    if re.match(r"^\d+\.\s", line):
        return ("numbered", re.sub(r"^\d+\.\s", "", line))

    # Blockquote
    if line.startswith("> "):
        return ("quote", line[2:])

    # Code block markers
    if line.startswith("```"):
        return ("code_marker", line[3:])

    # Regular paragraph
    return ("text", line)


def clean_inline_markdown(text: str) -> str:
    """Remove inline markdown formatting"""
    # Remove bold **text**
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    # Remove italic *text*
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    # Remove inline code `text`
    return re.sub(r"`(.*?)`", r"\1", text)


def render_slide_content(pdf: DeckPDF, content: str, start_y: float) -> None:  # noqa: C901, PLR0912, PLR0915
    """
    Render markdown content on the slide

    Args:
        pdf: FPDF instance
        content: Markdown content
        start_y: Starting Y position
    """
    max_y = 7.5  # Maximum Y position before bottom of page
    lines = content.split("\n")
    y_pos = start_y
    in_code_block = False
    code_lines = []

    for line in lines:
        line_type, text = parse_markdown_line(line)

        # Handle code blocks
        if line_type == "code_marker":
            if not in_code_block:
                in_code_block = True
                code_lines = []
            else:
                # End of code block - render with modern styling
                if code_lines and y_pos < max_y:
                    block_height = len(code_lines) * 0.22 + 0.25

                    # Modern dark code block background
                    pdf.set_fill_color(248, 248, 248)
                    pdf.rect(pdf.l_margin, y_pos, 9.4, block_height, "F")

                    # Red accent border
                    pdf.set_draw_color(*PRIMARY_RED)
                    pdf.set_line_width(0.02)
                    pdf.rect(pdf.l_margin, y_pos, 9.4, block_height, "D")
                    pdf.set_line_width(0.2)  # Reset

                    pdf.set_font("Courier", "", 13)
                    pdf.set_text_color(*TEXT_DARK)
                    y_pos += 0.12

                    for code_line in code_lines:
                        if y_pos > max_y:
                            break
                        pdf.set_xy(pdf.l_margin + 0.2, y_pos)
                        pdf.cell(0, 0.22, code_line)
                        y_pos += 0.22

                    y_pos += 0.18

                in_code_block = False
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        if y_pos > max_y:  # Near bottom of page
            break

        if line_type == "empty":
            y_pos += 0.15
        elif line_type == "h1":
            # Modern large header with red underline
            pdf.set_font("Helvetica", "B", 34)
            pdf.set_text_color(*TEXT_DARK)
            pdf.set_xy(pdf.l_margin, y_pos)
            pdf.multi_cell(9.4, 0.38, clean_inline_markdown(text))
            # Red accent underline
            current_y = pdf.get_y()
            pdf.set_fill_color(*PRIMARY_RED)
            pdf.rect(pdf.l_margin, current_y + 0.05, 1.5, 0.04, "F")
            y_pos = current_y + 0.25
        elif line_type == "h2":
            pdf.set_font("Helvetica", "B", 28)
            pdf.set_text_color(*PRIMARY_RED)
            pdf.set_xy(pdf.l_margin, y_pos)
            pdf.multi_cell(9.4, 0.32, clean_inline_markdown(text))
            y_pos = pdf.get_y() + 0.2
        elif line_type == "h3":
            pdf.set_font("Helvetica", "B", 22)
            pdf.set_text_color(*TEXT_DARK)
            pdf.set_xy(pdf.l_margin, y_pos)
            pdf.multi_cell(9.4, 0.27, clean_inline_markdown(text))
            y_pos = pdf.get_y() + 0.18
        elif line_type == "bullet":
            # Modern bullet with red square
            pdf.set_fill_color(*PRIMARY_RED)
            pdf.rect(pdf.l_margin + 0.02, y_pos + 0.06, 0.08, 0.08, "F")

            pdf.set_font("Helvetica", "", 17)
            pdf.set_text_color(*TEXT_MEDIUM)
            pdf.set_xy(pdf.l_margin + 0.3, y_pos)
            pdf.multi_cell(9.1, 0.22, clean_inline_markdown(text))
            y_pos = pdf.get_y() + 0.1
        elif line_type == "numbered":
            pdf.set_font("Helvetica", "", 17)
            pdf.set_text_color(*TEXT_MEDIUM)
            pdf.set_xy(pdf.l_margin + 0.3, y_pos)
            pdf.multi_cell(9.1, 0.22, clean_inline_markdown(text))
            y_pos = pdf.get_y() + 0.1
        elif line_type == "quote":
            # Modern red accent bar
            pdf.set_fill_color(*ACCENT_RED)
            pdf.rect(pdf.l_margin, y_pos, 0.06, 0.28, "F")

            pdf.set_font("Helvetica", "I", 15)
            pdf.set_text_color(*MUTED_GRAY)
            pdf.set_xy(pdf.l_margin + 0.25, y_pos)
            pdf.multi_cell(9.15, 0.2, clean_inline_markdown(text))
            y_pos = pdf.get_y() + 0.15
        else:  # Regular text
            pdf.set_font("Helvetica", "", 17)
            pdf.set_text_color(*TEXT_MEDIUM)
            pdf.set_xy(pdf.l_margin, y_pos)
            pdf.multi_cell(9.4, 0.22, clean_inline_markdown(text))
            y_pos = pdf.get_y() + 0.1


@router.post("/export", response_model=PDFExportResponse)
async def export_pdf(request: PDFExportRequest) -> PDFExportResponse:
    """
    Generate PDF from deck slides using fpdf2

    Args:
        request: Deck data with slides

    Returns:
        PDFExportResponse with base64 encoded PDF

    Raises:
        HTTPException: If PDF generation fails
    """
    logger.info(
        "Generating PDF for deck: %s with %d slides", request.deck_name, len(request.slides)
    )

    try:
        # Create PDF
        pdf = DeckPDF()
        pdf.set_title(request.deck_name)
        pdf.set_author("XDeck")

        # Generate each slide
        for slide in request.slides:
            pdf.add_slide_page(slide.slide_number, len(request.slides))

            # Modern slide title with gradient effect
            pdf.set_font("Helvetica", "B", 42)
            pdf.set_text_color(*PRIMARY_RED)
            pdf.set_xy(pdf.l_margin, 1.0)
            pdf.multi_cell(9.4, 0.45, slide.title)

            # Decorative red line under title
            title_end_y = pdf.get_y()
            pdf.set_fill_color(*ACCENT_RED)
            pdf.rect(pdf.l_margin, title_end_y + 0.08, 2.5, 0.05, "F")

            # Slide content starts after title with more spacing
            content_start_y = title_end_y + 0.35
            render_slide_content(pdf, slide.content, content_start_y)

        # Get PDF bytes
        pdf_bytes = pdf.output()
        pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

        logger.info("PDF generated successfully: %d bytes", len(pdf_bytes))

        return PDFExportResponse(success=True, pdf_base64=pdf_base64)

    except Exception as e:
        logger.exception("Failed to generate PDF")
        error_message = f"PDF generation failed: {e}"
        raise HTTPException(status_code=500, detail=error_message) from e
