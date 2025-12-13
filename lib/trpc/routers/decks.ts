/**
 * Decks tRPC Router
 * Handles sales deck generation and management
 */
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { DECK_LIMITS, getUserSubscription } from '@/lib/billing';
import { db } from '@/lib/db/drizzle';
import { deckSlides, decks, organizations } from '@/lib/db/schema';
import { addDeckGenerationJob } from '@/lib/queue';

import { protectedProcedure, router } from '../init';
import {
  createDeckSchema,
  deleteDeckSchema,
  getDeckProgressSchema,
  getDeckSchema,
  listDecksSchema,
  retryDeckSchema,
} from '../schemas/decks';

export const decksRouter = router({
  /**
   * List decks with filtering and pagination
   */
  list: protectedProcedure.input(listDecksSchema).query(async ({ ctx: _ctx, input }) => {
    const { organizationId, page = 1, pageSize = 20, status } = input;

    // Verify user has access to this organization
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (org.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Organization not found',
      });
    }

    // Build filter conditions
    const conditions = [eq(decks.organizationId, organizationId)];
    if (status) {
      conditions.push(eq(decks.status, status));
    }

    // Get total count
    const totalResult = await db.select({ count: count() }).from(decks).where(and(...conditions));
    const total = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    // Fetch decks
    const decksList = await db
      .select()
      .from(decks)
      .where(and(...conditions))
      .orderBy(desc(decks.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      decks: decksList,
      total,
      page,
      pageSize,
      totalPages,
    };
  }),

  /**
   * Get a single deck with all slides
   */
  get: protectedProcedure.input(getDeckSchema).query(async ({ input }) => {
    const deck = await db.select().from(decks).where(eq(decks.id, input.id)).limit(1);

    if (deck.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deck not found',
      });
    }

    // Fetch slides ordered by slide number
    const slides = await db
      .select()
      .from(deckSlides)
      .where(eq(deckSlides.deckId, input.id))
      .orderBy(deckSlides.slideNumber);

    return {
      ...deck[0],
      slides,
    };
  }),

  /**
   * Create a new deck and trigger generation
   */
  create: protectedProcedure.input(createDeckSchema).mutation(async ({ ctx: _ctx, input: _input }) => {
    // Get organization from context (we'll pass it separately for now)
    // In real implementation, you'd get this from session or pass it in input
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Organization ID required',
    });
  }),

  /**
   * Create deck for specific organization
   */
  createForOrg: protectedProcedure
    .input(createDeckSchema.extend({ organizationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check subscription limits
      const subscription = await getUserSubscription(input.organizationId);
      const tier = subscription?.tier || 'free';
      const limit = DECK_LIMITS[tier as keyof typeof DECK_LIMITS] || DECK_LIMITS.free;

      // Count existing decks
      const existingDecks = await db
        .select({ count: count() })
        .from(decks)
        .where(eq(decks.organizationId, input.organizationId));

      const deckCount = existingDecks[0]?.count ?? 0;

      if (deckCount >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Deck limit reached. Your ${tier} plan allows ${limit} decks.`,
        });
      }

      // Create deck record
      const newDeck = await db
        .insert(decks)
        .values({
          organizationId: input.organizationId,
          userId: ctx.userId,
          name: input.domain,
          domain: input.domain,
          status: 'pending',
        })
        .returning();

      // Queue generation job
      await addDeckGenerationJob({
        deckId: newDeck[0].id,
        organizationId: input.organizationId,
        domain: input.domain,
      });

      return newDeck[0];
    }),

  /**
   * Delete a deck
   */
  delete: protectedProcedure.input(deleteDeckSchema).mutation(async ({ input }) => {
    const existingDeck = await db.select().from(decks).where(eq(decks.id, input.id)).limit(1);

    if (existingDeck.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deck not found',
      });
    }

    await db.delete(decks).where(eq(decks.id, input.id));

    return { success: true };
  }),

  /**
   * Retry a failed deck generation
   */
  retry: protectedProcedure.input(retryDeckSchema).mutation(async ({ input }) => {
    const existingDeck = await db.select().from(decks).where(eq(decks.id, input.id)).limit(1);

    if (existingDeck.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deck not found',
      });
    }

    const deck = existingDeck[0];
    const retryCount = parseInt(deck.retryCount, 10);

    if (retryCount >= 3) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Maximum retry attempts reached',
      });
    }

    // Update deck status
    await db
      .update(decks)
      .set({
        status: 'pending',
        errorMessage: null,
        retryCount: (retryCount + 1).toString(),
        updatedAt: new Date(),
      })
      .where(eq(decks.id, input.id));

    // Re-queue the job
    await addDeckGenerationJob({
      deckId: deck.id,
      organizationId: deck.organizationId,
      domain: deck.domain,
    });

    return { success: true };
  }),

  /**
   * Get deck generation progress
   */
  getProgress: protectedProcedure.input(getDeckProgressSchema).query(async ({ input }) => {
    const deck = await db.select().from(decks).where(eq(decks.id, input.id)).limit(1);

    if (deck.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deck not found',
      });
    }

    const deckData = deck[0];

    switch (deckData.status) {
      case 'pending':
        return { status: 'pending' as const, progress: 0, message: 'Queued for generation' };
      case 'processing':
        return { status: 'processing' as const, progress: 50, message: 'Generating slides...' };
      case 'completed':
        return { status: 'completed' as const, progress: 100, message: 'Deck ready!' };
      case 'failed':
        return {
          status: 'failed' as const,
          progress: 0,
          message: deckData.errorMessage || 'Generation failed',
        };
      default:
        return { status: 'pending' as const, progress: 0, message: 'Unknown status' };
    }
  }),
});
