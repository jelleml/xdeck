// Re-export deck types from schema
export type { Deck, NewDeck, DeckSlide, NewDeckSlide, DeckStatus } from '@/lib/db/schema';

// Extended types for deck operations
export interface DeckWithSlides {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  domain: string;
  status: string;
  crawledContent: string | null;
  errorMessage: string | null;
  retryCount: string;
  createdAt: Date;
  updatedAt: Date;
  slides: Array<{
    id: string;
    deckId: string;
    slideNumber: string;
    title: string;
    content: string;
    createdAt: Date;
  }>;
}

export interface DeckGenerationProgress {
  status: 'crawling' | 'generating' | 'saving' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
}
