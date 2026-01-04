'use client';

import { use, useEffect, useRef, useState } from 'react';

import { trpc } from '@/lib/trpc/client';

import { DeckCarousel } from '@/components/deck-carousel';
import { Skeleton } from '@/components/ui/skeleton';

function SharePageSkeleton() {
  return (
    <div className="container mx-auto space-y-6 py-12">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-[500px] w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-32" />
      </div>
    </div>
  );
}

interface SharePageProps {
  params: Promise<{
    shareId: string;
  }>;
}

export default function SharePage({ params }: SharePageProps) {
  const resolvedParams = use(params);
  const [deckViewId, setDeckViewId] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const hasTrackedInitialView = useRef(false);

  const {
    data: shareData,
    isLoading,
    error,
  } = trpc.shares.getByShareId.useQuery(
    { shareId: resolvedParams.shareId },
    {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  const trackDeckView = trpc.views.trackDeckView.useMutation();
  const trackSlideView = trpc.views.trackSlideView.useMutation();

  // Track initial deck view
  useEffect(() => {
    if (shareData && !hasTrackedInitialView.current) {
      hasTrackedInitialView.current = true;
      startTimeRef.current = Date.now();

      trackDeckView.mutate(
        {
          deckId: shareData.deck.id,
          shareId: resolvedParams.shareId,
        },
        {
          onSuccess: (view) => {
            setDeckViewId(view.id);
          },
        }
      );
    }
  }, [shareData, resolvedParams.shareId, trackDeckView]);

  // Track view duration on unmount
  useEffect(() => {
    return () => {
      if (deckViewId) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        // Fire and forget - update view duration
        trackDeckView.mutate({
          deckId: shareData!.deck.id,
          shareId: resolvedParams.shareId,
          viewDuration: duration,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckViewId]);

  // Track slide views
  const handleSlideChange = (slideIndex: number) => {
    if (!deckViewId || !shareData?.deck.slides) return;

    const slide = shareData.deck.slides[slideIndex];
    if (slide) {
      trackSlideView.mutate({
        deckViewId,
        slideId: slide.id,
      });
    }
  };

  if (isLoading) {
    return <SharePageSkeleton />;
  }

  if (error || !shareData) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="mb-1 text-lg font-semibold">Share not found</h3>
          <p className="text-muted-foreground text-sm">
            {error?.message || 'This share link is invalid or has been disabled.'}
          </p>
        </div>
      </div>
    );
  }

  const { deck } = shareData;

  return (
    <div className="container mx-auto space-y-6 py-12">
      <div>
        <h1 className="text-3xl font-bold">{deck.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{deck.domain}</p>
      </div>

      {deck.slides && deck.slides.length > 0 ? (
        <DeckCarousel
          slides={deck.slides}
          viewOnly
          onSlideChange={handleSlideChange}
          defaultFullscreen
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="mb-1 text-lg font-semibold">No slides available</h3>
          <p className="text-muted-foreground text-sm">
            This deck doesn&apos;t have any slides yet.
          </p>
        </div>
      )}
    </div>
  );
}
