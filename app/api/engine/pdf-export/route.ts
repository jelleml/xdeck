import { NextResponse } from 'next/server';

import { exportDeckPDF } from '@/lib/engine';

/**
 * POST /api/engine/pdf-export
 * Export deck as PDF using Python engine
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { deckName, slides } = body;

    if (!deckName || !slides || !Array.isArray(slides)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Call Python engine to generate PDF
    const pdfBase64 = await exportDeckPDF({
      deckName,
      slides,
    });

    return NextResponse.json({ pdfBase64 });
  } catch (error) {
    console.error('PDF export failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF export failed' },
      { status: 500 }
    );
  }
}

