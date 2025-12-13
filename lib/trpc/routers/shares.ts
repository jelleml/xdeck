import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { deckShares, deckSlides, decks } from '@/lib/db/schema';

import { protectedProcedure, publicProcedure, router } from '../init';
import {
  createShareSchema,
  getShareByDeckIdSchema,
  getShareByIdSchema,
  toggleShareSchema,
} from '../schemas/shares';

export const sharesRouter = router({
  // Get share by ID (public - for viewing shared decks)
  getByShareId: publicProcedure.input(getShareByIdSchema).query(async ({ input }) => {
    const [share] = await db
      .select({
        share: deckShares,
        deck: decks,
      })
      .from(deckShares)
      .innerJoin(decks, eq(deckShares.deckId, decks.id))
      .where(eq(deckShares.id, input.shareId))
      .limit(1);

    if (!share) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Share not found',
      });
    }

    if (!share.share.isActive) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'This share link is no longer active',
      });
    }

    // Fetch slides ordered by slide number
    const slides = await db
      .select()
      .from(deckSlides)
      .where(eq(deckSlides.deckId, share.deck.id))
      .orderBy(deckSlides.slideNumber);

    return {
      ...share,
      deck: {
        ...share.deck,
        slides,
      },
    };
  }),

  // Get share by deck ID (protected - for deck owners)
  getByDeckId: protectedProcedure.input(getShareByDeckIdSchema).query(async ({ ctx, input }) => {
    // Verify deck belongs to user's organization
    const [deck] = await db
      .select()
      .from(decks)
      .where(eq(decks.id, input.deckId))
      .limit(1);

    if (!deck) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deck not found',
      });
    }

    // Check if user has access to this deck's organization
    if (deck.organizationId !== ctx.activeOrganizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this deck',
      });
    }

    const [share] = await db
      .select()
      .from(deckShares)
      .where(eq(deckShares.deckId, input.deckId))
      .limit(1);

    return share ?? null;
  }),

  // Create share (protected)
  create: protectedProcedure.input(createShareSchema).mutation(async ({ ctx, input }) => {
    // Verify deck belongs to user's organization
    const [deck] = await db
      .select()
      .from(decks)
      .where(eq(decks.id, input.deckId))
      .limit(1);

    if (!deck) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deck not found',
      });
    }

    if (deck.organizationId !== ctx.activeOrganizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this deck',
      });
    }

    // Check if share already exists
    const [existingShare] = await db
      .select()
      .from(deckShares)
      .where(eq(deckShares.deckId, input.deckId))
      .limit(1);

    if (existingShare) {
      return existingShare;
    }

    // Create new share
    const [newShare] = await db
      .insert(deckShares)
      .values({
        deckId: input.deckId,
        isActive: true,
      })
      .returning();

    return newShare;
  }),

  // Toggle share active status (protected)
  toggle: protectedProcedure.input(toggleShareSchema).mutation(async ({ ctx, input }) => {
    // Get share and verify access
    const [share] = await db
      .select({
        share: deckShares,
        deck: decks,
      })
      .from(deckShares)
      .innerJoin(decks, eq(deckShares.deckId, decks.id))
      .where(eq(deckShares.id, input.shareId))
      .limit(1);

    if (!share) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Share not found',
      });
    }

    if (share.deck.organizationId !== ctx.activeOrganizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this share',
      });
    }

    // Update share status
    const [updatedShare] = await db
      .update(deckShares)
      .set({ isActive: input.isActive })
      .where(eq(deckShares.id, input.shareId))
      .returning();

    return updatedShare;
  }),
});

