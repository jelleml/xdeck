'use client';

import { trpc } from '@/lib/trpc/client';

import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for deck operations
 * Wraps tRPC calls with error handling and toast notifications
 */
export function useDecks(organizationId: string) {
  const { toast } = useToast();

  // List decks
  const {
    data: decksData,
    isLoading,
    refetch,
  } = trpc.decks.list.useQuery(
    {
      organizationId,
      page: 1,
      pageSize: 50,
    },
    {
      enabled: !!organizationId,
      staleTime: 1000 * 10, // 10 seconds - short for real-time status updates
    }
  );

  // Create deck
  const createDeck = trpc.decks.createForOrg.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Deck generation started' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete deck
  const deleteDeck = trpc.decks.delete.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Deck deleted successfully' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Retry deck
  const retryDeck = trpc.decks.retry.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Deck generation restarted' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    decks: decksData?.decks ?? [],
    total: decksData?.total ?? 0,
    isLoading,
    createDeck: createDeck.mutate,
    isCreating: createDeck.isPending,
    deleteDeck: deleteDeck.mutate,
    isDeleting: deleteDeck.isPending,
    retryDeck: retryDeck.mutate,
    isRetrying: retryDeck.isPending,
    refetch,
  };
}

/**
 * Hook for single deck with slides
 */
export function useDeck(deckId: string) {
  const {
    data: deck,
    isLoading,
    refetch,
  } = trpc.decks.get.useQuery(
    { id: deckId },
    {
      enabled: !!deckId,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );

  return {
    deck,
    isLoading,
    refetch,
  };
}

/**
 * Hook for polling deck generation progress
 */
export function useDeckProgress(deckId: string, enabled: boolean = true) {
  const { data: progress } = trpc.decks.getProgress.useQuery(
    { id: deckId },
    {
      enabled: enabled && !!deckId,
      refetchInterval: 3000, // Poll every 3 seconds
      staleTime: 0, // Always fetch fresh data
    }
  );

  return {
    progress,
    isGenerating: progress?.status === 'pending' || progress?.status === 'processing',
  };
}
