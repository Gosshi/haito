'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { useRoadmapStore } from '../../stores/roadmap-store';
import { Card, CardContent } from '../ui/card';

type ChartDataPoint = {
  year: number;
  annual_dividend: number;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
  label?: number;
};

const formatYearLabel = (year: number): string => `${year}年`;

const formatCurrency = (value: number): string => formatCurrencyJPY(value);

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0 || label === undefined) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 font-medium">{formatYearLabel(label)}</p>
      <p className="text-sm">年間配当: {formatCurrency(data.annual_dividend)}</p>
    </div>
  );
};

export function RoadmapChart() {
  const response = useRoadmapStore((state) => state.response);
  const isLoading = useRoadmapStore((state) => state.isLoading);

  const series = response?.series ?? [];
  const seriesData = Array.isArray(series) ? series : [];
  const target = response?.result?.target_annual_dividend ?? null;

  return (
    <Card>
      <CardContent className="py-6">
        {isLoading && (
          <p className="text-sm text-muted-foreground">計算中...</p>
        )}
        {!isLoading && seriesData.length === 0 && (
          <p className="text-sm text-muted-foreground">
            配当推移のデータがまだありません
          </p>
        )}
        {!isLoading && seriesData.length > 0 && (
          <div data-testid="roadmap-series-chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={seriesData}
                margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tickFormatter={(value) => formatYearLabel(Number(value))}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip content={<CustomTooltip />} />
                {typeof target === 'number' && (
                  <ReferenceLine
                    y={target}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    data-testid="roadmap-target-line"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="annual_dividend"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
