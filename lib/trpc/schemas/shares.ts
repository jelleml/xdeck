import { z } from 'zod';

// Get share by ID (public)
export const getShareByIdSchema = z.object({
  shareId: z.string().uuid('Invalid share ID'),
});

// Get share by deck ID (protected)
export const getShareByDeckIdSchema = z.object({
  deckId: z.string().uuid('Invalid deck ID'),
});

// Create share (protected)
export const createShareSchema = z.object({
  deckId: z.string().uuid('Invalid deck ID'),
});

// Toggle share active status (protected)
export const toggleShareSchema = z.object({
  shareId: z.string().uuid('Invalid share ID'),
  isActive: z.boolean(),
});
