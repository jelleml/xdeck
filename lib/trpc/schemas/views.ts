import { z } from 'zod';

// Track deck view (public)
export const trackDeckViewSchema = z.object({
  deckId: z.string().uuid('Invalid deck ID'),
  shareId: z.string().uuid('Invalid share ID').optional(),
  viewDuration: z.number().int().min(0).optional(), // Duration in seconds
});

// Track slide view (public)
export const trackSlideViewSchema = z.object({
  deckViewId: z.string().uuid('Invalid deck view ID'),
  slideId: z.string().uuid('Invalid slide ID'),
});

// Get deck analytics (protected)
export const getDeckAnalyticsSchema = z.object({
  deckId: z.string().uuid('Invalid deck ID'),
});

// Get organization analytics (protected)
export const getOrganizationAnalyticsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

