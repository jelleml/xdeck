import { createQueue } from '../client';
import { JOB_NAMES, QUEUE_NAMES } from '../config';

/**
 * Deck generation queue
 * Handles async generation of sales decks using Firecrawl + OpenAI
 */

export interface DeckGenerationJobData {
  /**
   * Deck ID to update
   */
  deckId: string;

  /**
   * Organization ID for company info
   */
  organizationId: string;

  /**
   * Domain to crawl
   */
  domain: string;
}

export const deckGenerationQueue = createQueue<DeckGenerationJobData>(QUEUE_NAMES.DECKS);

/**
 * Add deck generation job to the queue
 */
export async function addDeckGenerationJob(data: DeckGenerationJobData) {
  return await deckGenerationQueue.add(JOB_NAMES.GENERATE_DECK, data, {
    // Use deckId as jobId to prevent duplicates
    jobId: `deck-${data.deckId}`,
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 second delay
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  });
}

