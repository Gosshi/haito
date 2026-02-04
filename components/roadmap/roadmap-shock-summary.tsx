'use client';

import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { useRoadmapShockStore } from '../../stores/roadmap-shock-store';
import { Card, CardContent } from '../ui/card';

const formatYearDelay = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }
  return `${value}年`;
};

export function RoadmapShockSummary() {
  const response = useRoadmapShockStore((state) => state.response);
  const isLoading = useRoadmapShockStore((state) => state.isLoading);

  const delta = response?.delta ?? null;
  const hasData = Boolean(response);

  return (
    <Card>
      <CardContent className="py-6">
        {isLoading && (
          <p className="text-sm text-muted-foreground">計算中...</p>
        )}
        {!isLoading && !hasData && (
          <p className="text-sm text-muted-foreground">
            ストレステスト結果がまだありません
          </p>
        )}
        {!isLoading && hasData && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">達成年数の遅れ</p>
              <p className="text-2xl font-semibold">
                {formatYearDelay(delta?.achieved_year_delay ?? null)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">期末配当差分</p>
              <p className="text-2xl font-semibold">
                {formatCurrencyJPY(delta?.end_annual_dividend_gap ?? null)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
