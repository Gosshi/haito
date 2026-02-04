'use client';

import { useMemo } from 'react';

import { formatCurrencyJPY } from '../../lib/dashboard/format';
import type { RoadmapHistoryListItem } from '../../lib/roadmap-history/types';
import { useRoadmapHistoryStore } from '../../stores/roadmap-history-store';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

const formatTaxMode = (value: string | undefined): string => {
  if (value === 'pretax') {
    return '税引前';
  }
  if (value === 'after_tax') {
    return '税引後';
  }
  return '-';
};

const resolveSummaryValue = (item: RoadmapHistoryListItem): number | null => {
  if (typeof item.summary?.result?.target_annual_dividend === 'number') {
    return item.summary.result.target_annual_dividend;
  }
  return null;
};

export function RoadmapHistoryList() {
  const items = useRoadmapHistoryStore((state) => state.items);
  const isLoading = useRoadmapHistoryStore((state) => state.isLoading);
  const selectedId = useRoadmapHistoryStore((state) => state.selectedId);
  const compareSelection = useRoadmapHistoryStore((state) => state.compareSelection);
  const selectHistory = useRoadmapHistoryStore((state) => state.selectHistory);
  const toggleCompareSelection = useRoadmapHistoryStore(
    (state) => state.toggleCompareSelection
  );

  const rows = useMemo(() => {
    return items.map((item) => ({
      ...item,
      formattedDate: formatDate(item.created_at),
      formattedTarget: formatCurrencyJPY(resolveSummaryValue(item)),
    }));
  }, [items]);

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div>
          <h2 className="text-lg font-semibold">履歴一覧</h2>
          <p className="text-xs text-muted-foreground">
            最新の実行結果から順に表示されます。
          </p>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        )}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            まだ履歴がありません。
          </p>
        )}
        {!isLoading && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((item) => {
              const isSelected = selectedId === item.id;
              const isCompared = compareSelection.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-md border p-4 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.formattedDate}</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => void selectHistory(item.id)}
                      >
                        詳細を開く
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isCompared ? 'default' : 'outline'}
                        onClick={() => toggleCompareSelection(item.id)}
                      >
                        {isCompared ? '比較から外す' : '比較に追加'}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">年間配当ゴール</p>
                      <p className="text-base font-semibold">{item.formattedTarget}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">税区分</p>
                      <p className="text-base font-semibold">
                        {formatTaxMode(item.input.assumptions?.tax_mode)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
