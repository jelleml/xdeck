import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { deckSlides, decks, organizations } from '@/lib/db/schema';
import { crawlWebsite, generateDeck } from '@/lib/engine';

import type { DeckGenerationJobData } from '../queues/decks';

/**
 * Deck Generation Job Processor
 *
 * Pure business logic - no worker-specific code.
 * Returns structured result for worker to handle.
 */
export async function processDeckGeneration(data: DeckGenerationJobData): Promise<{
  success: boolean;
  deckId: string;
  slidesCount: number;
  duration: number;
  error?: string;
}> {
  console.log('[JOB] 🎨 Starting deck generation for:', data.deckId);

  const startTime = Date.now();

  try {
    // Update deck status to processing
    await db.update(decks).set({ status: 'processing', updatedAt: new Date() }).where(eq(decks.id, data.deckId));

    // Step 1: Crawl the domain using Firecrawl
    console.log('[JOB] 🕷️  Crawling domain:', data.domain);
    const markdown = await crawlWebsite(data.domain);

    if (!markdown) {
      throw new Error('No content found on the website');
    }

    console.log('[JOB] ✅ Crawled domain, content length:', markdown.length);

    // Get organization company info
    const org = await db
      .select({
        companyDescription: organizations.companyDescription,
        productDescription: organizations.productDescription,
        serviceDescription: organizations.serviceDescription,
      })
      .from(organizations)
      .where(eq(organizations.id, data.organizationId))
      .limit(1);

    const orgInfo = org[0] || {};

    // Step 2: Generate deck using OpenAI
    console.log('[JOB] 🤖 Generating deck with AI...');
    const slides = await generateDeck({
      markdown,
      companyDescription: orgInfo.companyDescription || undefined,
      productDescription: orgInfo.productDescription || undefined,
      serviceDescription: orgInfo.serviceDescription || undefined,
    });

    if (!slides || slides.length !== 5) {
      throw new Error(`Expected 5 slides, got ${slides?.length || 0}`);
    }

    console.log('[JOB] ✅ Generated', slides.length, 'slides');

    // Step 3: Save slides to database
    const slideValues = slides.map((slide, index) => ({
      deckId: data.deckId,
      slideNumber: (index + 1).toString(),
      title: slide.title,
      content: slide.content,
    }));

    await db.insert(deckSlides).values(slideValues);

    // Step 4: Update deck status to completed
    await db
      .update(decks)
      .set({
        status: 'completed',
        crawledContent: markdown,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(decks.id, data.deckId));

    const duration = Date.now() - startTime;

    console.log('[JOB] ✅ Deck generation completed:', {
      deckId: data.deckId,
      slidesCount: slides.length,
      duration: `${duration}ms`,
    });

    return {
      success: true,
      deckId: data.deckId,
      slidesCount: slides.length,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('[JOB] ❌ Deck generation failed:', {
      deckId: data.deckId,
      error: errorMessage,
      duration: `${duration}ms`,
    });

    // Update deck status to failed
    await db
      .update(decks)
      .set({
        status: 'failed',
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(decks.id, data.deckId));

    return {
      success: false,
      deckId: data.deckId,
      slidesCount: 0,
      duration,
      error: errorMessage,
    };
  }
}

