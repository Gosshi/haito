'use client';

import { formatCurrencyJPY } from '../../lib/dashboard/format';
import type { RoadmapHistoryDetail } from '../../lib/roadmap-history/types';
import { useRoadmapHistoryStore } from '../../stores/roadmap-history-store';
import { Card, CardContent } from '../ui/card';

const resolveCompareItems = (
  compareSelection: string[],
  detailsById: Record<string, RoadmapHistoryDetail>
): RoadmapHistoryDetail[] => {
  return compareSelection
    .map((id) => detailsById[id])
    .filter((item): item is RoadmapHistoryDetail => Boolean(item));
};

const resolveSeriesEndValue = (detail: RoadmapHistoryDetail): string => {
  if (!Array.isArray(detail.series) || detail.series.length === 0) {
    return '-';
  }
  const lastPoint = detail.series[detail.series.length - 1];
  return formatCurrencyJPY(lastPoint?.annual_dividend ?? null);
};

export function RoadmapHistoryCompare() {
  const compareSelection = useRoadmapHistoryStore(
    (state) => state.compareSelection
  );
  const detailsById = useRoadmapHistoryStore((state) => state.detailsById);

  const compareItems = resolveCompareItems(compareSelection, detailsById);

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div>
          <h2 className="text-lg font-semibold">比較サマリー</h2>
          <p className="text-xs text-muted-foreground">
            選択した履歴の入力条件と結果を並べて確認します。
          </p>
        </div>

        {compareItems.length === 0 && (
          <p className="text-sm text-muted-foreground">
            比較する履歴を選択してください
          </p>
        )}

        {compareItems.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {compareItems.map((item) => (
              <div key={item.id} className="rounded-md border p-4">
                <p className="text-sm font-medium">{item.id}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">年間配当ゴール</span>
                    <span className="font-semibold">
                      {formatCurrencyJPY(
                        item.summary?.result?.target_annual_dividend ?? null
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">毎月の追加投資額</span>
                    <span className="font-semibold">
                      {formatCurrencyJPY(item.input.monthly_contribution ?? null)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">期間</span>
                    <span className="font-semibold">
                      {item.input.horizon_years}年
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      最終年の年間配当
                    </span>
                    <span className="font-semibold">
                      {resolveSeriesEndValue(item)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
