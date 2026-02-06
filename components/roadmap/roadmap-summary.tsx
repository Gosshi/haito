'use client';

import type { DividendGoalResult } from '../../lib/simulations/types';
import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { formatPercent } from '../../lib/portfolio/format';
import { useRoadmapStore } from '../../stores/roadmap-store';
import { Card, CardContent } from '../ui/card';

const getCurrentYear = () => new Date().getFullYear();

const formatYearsToGoal = (result: DividendGoalResult | null): string => {
  if (!result) {
    return '-';
  }

  if (result.achieved === false) {
    return '未達';
  }

  if (typeof result.achieved_in_year !== 'number') {
    return '未達';
  }

  const diff = result.achieved_in_year - getCurrentYear();
  return `${Math.max(diff, 0)}年`;
};

const formatRate = (value: number | null | undefined): string | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return formatPercent(value);
};

export function RoadmapSummary() {
  const response = useRoadmapStore((state) => state.response);
  const isLoading = useRoadmapStore((state) => state.isLoading);

  const snapshot = response?.snapshot ?? null;
  const result = response?.result ?? null;
  const hasData = Boolean(snapshot || result);

  const currentYieldRate = formatRate(snapshot?.current_yield_rate ?? null);
  const kpiItems = [
    {
      label: '現在の年間配当',
      value: formatCurrencyJPY(snapshot?.current_annual_dividend ?? null),
    },
    {
      label: '配当ゴール',
      value: formatCurrencyJPY(result?.target_annual_dividend ?? null),
    },
    {
      label: 'ゴール到達までの年数',
      value: formatYearsToGoal(result),
    },
    {
      label: '最終年の年間配当（試算）',
      value: formatCurrencyJPY(result?.end_annual_dividend ?? null),
    },
  ];

  return (
    <Card>
      <CardContent className="py-6">
        {!isLoading && !hasData && (
          <p className="text-sm text-muted-foreground">
            ロードマップ結果がまだありません
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {kpiItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <p
                className="text-sm text-muted-foreground"
                data-testid="roadmap-kpi-label"
              >
                {item.label}
              </p>
              <p className="text-2xl font-semibold">
                {isLoading ? '計算中...' : item.value}
              </p>
              {item.label === '現在の年間配当' && currentYieldRate && !isLoading && (
                <p className="text-xs text-muted-foreground">
                  現状利回り: {currentYieldRate}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
