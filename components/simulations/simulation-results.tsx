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

import type { DividendGoalRecommendation } from '../../lib/simulations/types';
import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { useSimulationStore } from '../../stores/simulation-store';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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

const stringifyRecommendation = (recommendation: DividendGoalRecommendation): string => {
  try {
    const json = JSON.stringify(recommendation, null, 2);
    if (json) {
      return json;
    }
  } catch {
    // Ignore stringify errors and fallback to string conversion.
  }

  return String(recommendation);
};

export function SimulationResults() {
  const response = useSimulationStore((state) => state.response);
  const error = useSimulationStore((state) => state.error);
  const isLoading = useSimulationStore((state) => state.isLoading);

  const snapshot = response?.snapshot ?? null;
  const result = response?.result ?? null;
  const series = response?.series ?? [];
  const recommendations = response?.recommendations ?? [];

  const kpiItems = [
    typeof snapshot?.current_annual_dividend === 'number'
      ? {
          label: '現在の年間配当',
          value: formatCurrency(snapshot.current_annual_dividend),
        }
      : null,
    typeof result?.target_annual_dividend === 'number'
      ? {
          label: '目標年間配当',
          value: formatCurrency(result.target_annual_dividend),
        }
      : null,
    typeof result?.achieved_in_year === 'number'
      ? {
          label: '達成年',
          value: formatYearLabel(result.achieved_in_year),
        }
      : null,
    typeof result?.end_annual_dividend === 'number'
      ? {
          label: '期末年間配当',
          value: formatCurrency(result.end_annual_dividend),
        }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  const seriesData = Array.isArray(series) ? series : [];
  const recommendationItems = Array.isArray(recommendations) ? recommendations : [];
  const hasAnyResults =
    kpiItems.length > 0 || seriesData.length > 0 || recommendationItems.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">シミュレーション結果</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground">計算中...</p>
          )}
          {!isLoading && !error && !hasAnyResults && (
            <p className="text-sm text-muted-foreground">
              シミュレーション結果がまだありません
            </p>
          )}
          {!isLoading && kpiItems.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {kpiItems.map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {seriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">配当推移</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="simulation-series-chart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={seriesData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
          </CardContent>
        </Card>
      )}

      {recommendationItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">推奨事項</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendationItems.map((recommendation, index) => (
                <div
                  key={`recommendation-${index}`}
                  data-testid="recommendation-card"
                  className="rounded-md border p-4"
                >
                  <p className="text-sm font-medium">推奨 {index + 1}</p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                    {stringifyRecommendation(recommendation)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
