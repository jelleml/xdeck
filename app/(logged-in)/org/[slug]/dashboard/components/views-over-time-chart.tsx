'use client';

import { format } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ViewsOverTimeData {
  date: string;
  viewCount: number;
}

interface ViewsOverTimeChartProps {
  data: ViewsOverTimeData[];
}

const chartConfig = {
  viewCount: {
    label: 'Views',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function ViewsOverTimeChart({ data }: ViewsOverTimeChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Views Over Time</CardTitle>
          <CardDescription>Daily view trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No view data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalViews = data.reduce((sum, item) => sum + item.viewCount, 0);
  const avgViews = Math.round(totalViews / data.length);

  const chartData = data.map((item) => ({
    date: item.date,
    views: item.viewCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Views Over Time</CardTitle>
        <CardDescription>
          {format(new Date(data[0].date), 'MMM d')} - {format(new Date(data[data.length - 1].date), 'MMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return format(date, 'MMM d');
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return format(new Date(value), 'MMM d, yyyy');
                  }}
                />
              }
            />
            <Area
              dataKey="views"
              type="natural"
              fill="var(--color-viewCount)"
              fillOpacity={0.4}
              stroke="var(--color-viewCount)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {avgViews} average views per day <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Total {totalViews.toLocaleString()} views in this period
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

