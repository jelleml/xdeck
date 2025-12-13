'use client';

import { trpc } from '@/lib/trpc/client';

import { useOrganization } from '@/hooks/use-organization';

import { Skeleton } from '@/components/ui/skeleton';

import { AnalyticsStats } from './components/analytics-stats';
import { MostViewedDecksChart } from './components/most-viewed-decks-chart';
import { MostViewedSlidesChart } from './components/most-viewed-slides-chart';
import { ViewsOverTimeChart } from './components/views-over-time-chart';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-96" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { organization, isLoading: isLoadingOrg } = useOrganization();

  const { data: analytics, isLoading: isLoadingAnalytics } = trpc.views.getOrganizationAnalytics.useQuery(
    {
      organizationId: organization?.id ?? '',
    },
    {
      enabled: !!organization?.id,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );

  if (isLoadingOrg || isLoadingAnalytics) {
    return <DashboardSkeleton />;
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View analytics for your shared decks
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="font-semibold text-lg mb-1">No analytics available</h3>
          <p className="text-sm text-muted-foreground">
            Share your decks to start tracking views
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View analytics for your shared decks
        </p>
      </div>

      <AnalyticsStats
        totalViews={analytics.totalViews}
        avgViewDuration={analytics.avgViewDuration}
      />

      <ViewsOverTimeChart data={analytics.viewsOverTime} />

      <div className="grid gap-6 md:grid-cols-2">
        <MostViewedDecksChart decks={analytics.mostViewedDecks} />
        <MostViewedSlidesChart slides={analytics.mostViewedSlides} />
      </div>
    </div>
  );
}
