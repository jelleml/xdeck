'use client';

import { Eye } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface MostViewedDeck {
  deckId: string;
  deckName: string;
  deckDomain: string;
  viewCount: number;
}

interface MostViewedDecksChartProps {
  decks: MostViewedDeck[];
}

const chartConfig = {
  viewCount: {
    label: 'Views',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function MostViewedDecksChart({ decks }: MostViewedDecksChartProps) {
  if (decks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Viewed Decks</CardTitle>
          <CardDescription>Top performing decks by views</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">No deck views yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = decks.map((deck) => ({
    name: deck.deckName.length > 20 ? deck.deckName.substring(0, 20) + '...' : deck.deckName,
    fullName: deck.deckName,
    views: deck.viewCount,
    deckId: deck.deckId,
  }));

  const totalViews = decks.reduce((sum, deck) => sum + deck.viewCount, 0);
  const topDeck = decks[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Viewed Decks</CardTitle>
        <CardDescription>Top {decks.length} performing decks by views</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
              right: 12,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={120}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
              formatter={(value, name, props) => {
                return [
                  <div key="tooltip" className="flex flex-col">
                    <span className="font-medium">{props.payload.fullName}</span>
                    <span className="text-muted-foreground">{value} views</span>
                  </div>,
                ];
              }}
            />
            <Bar dataKey="views" fill="var(--color-viewCount)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              <Eye className="h-4 w-4" />
              {topDeck.deckName} leads with {topDeck.viewCount} views
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Total {totalViews.toLocaleString()} views across top decks
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
