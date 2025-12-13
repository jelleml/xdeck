/**
 * BullMQ Queue Module
 *
 * Centralized export for all queue functionality.
 */
import { scheduleSubscriptionSync } from './queues/subscriptions';

// Import other schedule functions as you add more queues

// Core utilities
export { createQueue, createWorker, createQueueEvents, gracefulShutdown } from './client';

// Constants
export { QUEUE_NAMES, JOB_NAMES } from './config';

// Subscription queue
export {
  subscriptionQueue,
  addSubscriptionSyncJob,
  scheduleSubscriptionSync,
  type SubscriptionSyncJobData,
} from './queues/subscriptions';

// Deck generation queue
export {
  deckGenerationQueue,
  addDeckGenerationJob,
  type DeckGenerationJobData,
} from './queues/decks';

// Workers (for worker.ts)
export { subscriptionWorker } from './workers/subscriptions';
export { deckWorker } from './workers/decks';

// Job processors (for testing/debugging)
export { processSubscriptionSync } from './jobs/sync-subscriptions';
export { processDeckGeneration } from './jobs/generate-deck';

/**
 * Schedule all recurring jobs
 *
 * Call this once when the worker process starts.
 * Idempotent - safe to call multiple times.
 */
export async function scheduleAllJobs(): Promise<void> {
  await Promise.all([
    scheduleSubscriptionSync(),
    // Add more schedule functions here as you add queues
  ]);
}
