import { z } from 'zod';

// Domain validation regex (basic validation)
const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

export const createDeckSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .toLowerCase()
    .transform((val) => val.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, ''))
    .refine((val) => domainRegex.test(val), {
      message: 'Invalid domain format',
    }),
});

export const getDeckSchema = z.object({
  id: z.string().uuid(),
});

export const listDecksSchema = z.object({
  organizationId: z.string().uuid(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
});

export const deleteDeckSchema = z.object({
  id: z.string().uuid(),
});

export const retryDeckSchema = z.object({
  id: z.string().uuid(),
});

export const getDeckProgressSchema = z.object({
  id: z.string().uuid(),
});

