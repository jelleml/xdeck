import { createWorker } from '../client';
import { QUEUE_NAMES } from '../config';
import { processDeckGeneration } from '../jobs/generate-deck';
import type { DeckGenerationJobData } from '../queues/decks';

/**
 * Deck Generation Worker
 *
 * Processes deck generation jobs from the queue.
 */
export const deckWorker = createWorker<DeckGenerationJobData>(
  QUEUE_NAMES.DECKS,
  async (job: { data: DeckGenerationJobData; id?: string }) => {
    console.log(`[WORKER] Processing job (ID: ${job.id})`);

    // Process the deck generation
    const result = await processDeckGeneration(job.data);

    if (!result.success) {
      throw new Error(result.error || 'Deck generation failed');
    }

    return result;
  },
  {
    concurrency: 2, // Process 2 decks at a time
  }
);

// Error handling
deckWorker.on('failed', (job, err) => {
  console.error(`[WORKER] ❌ Job ${job?.id} failed:`, err.message);
});

deckWorker.on('completed', (job, result) => {
  console.log(`[WORKER] ✅ Job ${job.id} completed:`, result);
});
