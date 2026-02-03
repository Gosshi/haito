'use client';

import type { DividendGoalResult } from '../../lib/simulations/types';
import { formatCurrencyJPY } from '../../lib/dashboard/format';
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
    return '-';
  }

  const diff = result.achieved_in_year - getCurrentYear();
  return `${Math.max(diff, 0)}年`;
};

const formatRate = (value: number | null | undefined): string | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return `${value}%`;
};

export function RoadmapSummary() {
  const response = useRoadmapStore((state) => state.response);
  const isLoading = useRoadmapStore((state) => state.isLoading);

  const snapshot = response?.snapshot ?? null;
  const result = response?.result ?? null;
  const hasData = Boolean(snapshot || result);

  const currentYieldRate = formatRate(snapshot?.current_yield_rate ?? null);

  return (
    <Card>
      <CardContent className="py-6">
        {isLoading && (
          <p className="text-sm text-muted-foreground">計算中...</p>
        )}
        {!isLoading && !hasData && (
          <p className="text-sm text-muted-foreground">
            ロードマップ結果がまだありません
          </p>
        )}
        {!isLoading && hasData && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">現在の年間配当</p>
              <p className="text-2xl font-semibold">
                {formatCurrencyJPY(snapshot?.current_annual_dividend ?? null)}
              </p>
              {currentYieldRate && (
                <p className="text-xs text-muted-foreground">
                  現状利回り: {currentYieldRate}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">配当ゴール</p>
              <p className="text-2xl font-semibold">
                {formatCurrencyJPY(result?.target_annual_dividend ?? null)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ゴール到達までの年数</p>
              <p className="text-2xl font-semibold">
                {formatYearsToGoal(result)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                最終年の年間配当（試算）
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrencyJPY(result?.end_annual_dividend ?? null)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
