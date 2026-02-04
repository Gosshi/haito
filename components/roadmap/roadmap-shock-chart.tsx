'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DividendGoalSeriesPoint } from '../../lib/simulations/types';
import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { useRoadmapShockStore } from '../../stores/roadmap-shock-store';
import { Card, CardContent } from '../ui/card';

type ChartDataPoint = {
  year: number;
  base?: number | null;
  shocked?: number | null;
};

type SeriesConfig = {
  key: 'base' | 'shocked';
  name: string;
  color: string;
};

const seriesConfigs: SeriesConfig[] = [
  { key: 'base', name: '通常', color: '#2563eb' },
  { key: 'shocked', name: '減配後', color: '#dc2626' },
];

const formatYearLabel = (year: number): string => `${year}年`;

const formatCurrency = (value: number): string => formatCurrencyJPY(value);

const buildSeriesData = (
  baseSeries: DividendGoalSeriesPoint[],
  shockedSeries: DividendGoalSeriesPoint[]
): ChartDataPoint[] => {
  const dataByYear = new Map<number, ChartDataPoint>();

  baseSeries.forEach((point) => {
    const current = dataByYear.get(point.year) ?? { year: point.year };
    current.base = point.annual_dividend;
    dataByYear.set(point.year, current);
  });

  shockedSeries.forEach((point) => {
    const current = dataByYear.get(point.year) ?? { year: point.year };
    current.shocked = point.annual_dividend;
    dataByYear.set(point.year, current);
  });

  return Array.from(dataByYear.values()).sort((a, b) => a.year - b.year);
};

export function RoadmapShockChart() {
  const response = useRoadmapShockStore((state) => state.response);
  const isLoading = useRoadmapShockStore((state) => state.isLoading);

  const baseSeries = Array.isArray(response?.base?.series)
    ? response?.base?.series
    : [];
  const shockedSeries = Array.isArray(response?.shocked?.series)
    ? response?.shocked?.series
    : [];
  const seriesData = buildSeriesData(baseSeries, shockedSeries);

  return (
    <Card>
      <CardContent className="py-6">
        {isLoading && (
          <p className="text-sm text-muted-foreground">計算中...</p>
        )}
        {!isLoading && seriesData.length === 0 && (
          <p className="text-sm text-muted-foreground">
            ストレステストの比較データがまだありません
          </p>
        )}
        {!isLoading && seriesData.length > 0 && (
          <div data-testid="roadmap-shock-chart">
            <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {seriesConfigs.map((series) => (
                <div key={series.key} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: series.color }}
                  />
                  <span>{series.name}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={seriesData}
                margin={{ top: 20, right: 20, bottom: 20, left: 24 }}
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
                  width={84}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => formatYearLabel(Number(label))}
                />
                {seriesConfigs.map((series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    data-testid="roadmap-shock-line"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
