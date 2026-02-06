import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { deckSlides, deckViews, decks, slideViews } from '@/lib/db/schema';

import { protectedProcedure, publicProcedure, router } from '../init';
import {
  getDeckAnalyticsSchema,
  getOrganizationAnalyticsSchema,
  trackDeckViewSchema,
  trackSlideViewSchema,
} from '../schemas/views';

export const viewsRouter = router({
  // Track deck view (public - anyone can track views)
  trackDeckView: publicProcedure.input(trackDeckViewSchema).mutation(async ({ input }) => {
    const [newView] = await db
      .insert(deckViews)
      .values({
        deckId: input.deckId,
        shareId: input.shareId ?? null,
        viewDuration: input.viewDuration ? String(input.viewDuration) : null,
      })
      .returning();

    return newView;
  }),

  // Track slide view (public - anyone can track views)
  trackSlideView: publicProcedure.input(trackSlideViewSchema).mutation(async ({ input }) => {
    const [newView] = await db
      .insert(slideViews)
      .values({
        deckViewId: input.deckViewId,
        slideId: input.slideId,
      })
      .returning();

    return newView;
  }),

  // Get deck analytics (protected)
  getDeckAnalytics: protectedProcedure
    .input(getDeckAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      // Verify deck belongs to user's organization
      const [deck] = await db.select().from(decks).where(eq(decks.id, input.deckId)).limit(1);

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

      // Get total views
      const [totalViewsResult] = await db
        .select({ count: count() })
        .from(deckViews)
        .where(eq(deckViews.deckId, input.deckId));

      // Get average view duration
      const [avgDurationResult] = await db
        .select({
          avgDuration: sql<string>`AVG(CAST(${deckViews.viewDuration} AS INTEGER))`,
        })
        .from(deckViews)
        .where(and(eq(deckViews.deckId, input.deckId), sql`${deckViews.viewDuration} IS NOT NULL`));

      // Get most viewed slides
      const mostViewedSlides = await db
        .select({
          slideId: slideViews.slideId,
          slideNumber: deckSlides.slideNumber,
          slideTitle: deckSlides.title,
          viewCount: count(),
        })
        .from(slideViews)
        .innerJoin(deckSlides, eq(slideViews.slideId, deckSlides.id))
        .innerJoin(deckViews, eq(slideViews.deckViewId, deckViews.id))
        .where(eq(deckViews.deckId, input.deckId))
        .groupBy(slideViews.slideId, deckSlides.slideNumber, deckSlides.title)
        .orderBy(desc(count()))
        .limit(10);

      return {
        totalViews: totalViewsResult.count,
        avgViewDuration: avgDurationResult.avgDuration
          ? Math.round(Number(avgDurationResult.avgDuration))
          : 0,
        mostViewedSlides,
      };
    }),

  // Get organization analytics (protected)
  getOrganizationAnalytics: protectedProcedure
    .input(getOrganizationAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      // Verify user has access to organization
      if (input.organizationId !== ctx.activeOrganizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this organization',
        });
      }

      // Build date filter conditions
      const dateConditions = [];
      if (input.startDate) {
        dateConditions.push(gte(deckViews.viewedAt, input.startDate));
      }
      if (input.endDate) {
        dateConditions.push(lte(deckViews.viewedAt, input.endDate));
      }

      // Get total views across all organization decks
      const [totalViewsResult] = await db
        .select({ count: count() })
        .from(deckViews)
        .innerJoin(decks, eq(deckViews.deckId, decks.id))
        .where(
          and(
            eq(decks.organizationId, input.organizationId),
            dateConditions.length > 0 ? and(...dateConditions) : undefined
          )
        );

      // Get average view duration
      const [avgDurationResult] = await db
        .select({
          avgDuration: sql<string>`AVG(CAST(${deckViews.viewDuration} AS INTEGER))`,
        })
        .from(deckViews)
        .innerJoin(decks, eq(deckViews.deckId, decks.id))
        .where(
          and(
            eq(decks.organizationId, input.organizationId),
            sql`${deckViews.viewDuration} IS NOT NULL`,
            dateConditions.length > 0 ? and(...dateConditions) : undefined
          )
        );

      // Get most viewed decks
      const mostViewedDecks = await db
        .select({
          deckId: decks.id,
          deckName: decks.name,
          deckDomain: decks.domain,
          viewCount: count(),
        })
        .from(deckViews)
        .innerJoin(decks, eq(deckViews.deckId, decks.id))
        .where(
          and(
            eq(decks.organizationId, input.organizationId),
            dateConditions.length > 0 ? and(...dateConditions) : undefined
          )
        )
        .groupBy(decks.id, decks.name, decks.domain)
        .orderBy(desc(count()))
        .limit(10);

      // Get most viewed slides across all decks
      const mostViewedSlides = await db
        .select({
          slideId: slideViews.slideId,
          deckId: decks.id,
          deckName: decks.name,
          slideNumber: deckSlides.slideNumber,
          slideTitle: deckSlides.title,
          viewCount: count(),
        })
        .from(slideViews)
        .innerJoin(deckSlides, eq(slideViews.slideId, deckSlides.id))
        .innerJoin(decks, eq(deckSlides.deckId, decks.id))
        .innerJoin(deckViews, eq(slideViews.deckViewId, deckViews.id))
        .where(
          and(
            eq(decks.organizationId, input.organizationId),
            dateConditions.length > 0 ? and(...dateConditions) : undefined
          )
        )
        .groupBy(slideViews.slideId, decks.id, decks.name, deckSlides.slideNumber, deckSlides.title)
        .orderBy(desc(count()))
        .limit(10);

      // Get views over time (daily aggregation for past 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const viewsOverTime = await db
        .select({
          date: sql<string>`DATE(${deckViews.viewedAt})`,
          viewCount: count(),
        })
        .from(deckViews)
        .innerJoin(decks, eq(deckViews.deckId, decks.id))
        .where(
          and(
            eq(decks.organizationId, input.organizationId),
            gte(deckViews.viewedAt, input.startDate ?? thirtyDaysAgo),
            input.endDate ? lte(deckViews.viewedAt, input.endDate) : undefined
          )
        )
        .groupBy(sql`DATE(${deckViews.viewedAt})`)
        .orderBy(sql`DATE(${deckViews.viewedAt})`);

      return {
        totalViews: totalViewsResult.count,
        avgViewDuration: avgDurationResult.avgDuration
          ? Math.round(Number(avgDurationResult.avgDuration))
          : 0,
        mostViewedDecks,
        mostViewedSlides,
        viewsOverTime,
      };
    }),
});
