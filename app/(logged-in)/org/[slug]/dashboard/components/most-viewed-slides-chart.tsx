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

interface MostViewedSlide {
  slideId: string;
  deckId: string;
  deckName: string;
  slideNumber: string;
  slideTitle: string;
  viewCount: number;
}

interface MostViewedSlidesChartProps {
  slides: MostViewedSlide[];
}

const chartConfig = {
  viewCount: {
    label: 'Views',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function MostViewedSlidesChart({ slides }: MostViewedSlidesChartProps) {
  if (slides.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Viewed Slides</CardTitle>
          <CardDescription>Top performing slides by views</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">No slide views yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = slides.map((slide) => {
    const label = `Slide ${slide.slideNumber}`;
    const fullLabel = `Slide ${slide.slideNumber}: ${slide.slideTitle}`;
    return {
      name: label,
      fullName: fullLabel,
      deckName: slide.deckName,
      views: slide.viewCount,
      slideId: slide.slideId,
      deckId: slide.deckId,
    };
  });

  const totalViews = slides.reduce((sum, slide) => sum + slide.viewCount, 0);
  const topSlide = slides[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Viewed Slides</CardTitle>
        <CardDescription>Top {slides.length} performing slides by views</CardDescription>
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
              width={80}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
              formatter={(value, name, props) => {
                return [
                  <div key="tooltip" className="flex flex-col">
                    <span className="font-medium">{props.payload.fullName}</span>
                    <span className="text-muted-foreground text-xs">{props.payload.deckName}</span>
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
              Slide {topSlide.slideNumber} leads with {topSlide.viewCount} views
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Total {totalViews.toLocaleString()} views across top slides
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
