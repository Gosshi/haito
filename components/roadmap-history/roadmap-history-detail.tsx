'use client';

import { formatCurrencyJPY } from '../../lib/dashboard/format';
import type { RoadmapHistoryDetail } from '../../lib/roadmap-history/types';
import { useRoadmapHistoryStore } from '../../stores/roadmap-history-store';
import { Card, CardContent } from '../ui/card';

const formatYears = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }
  return `${value}年`;
};

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-base font-semibold">{value}</p>
  </div>
);

const formatDetailValue = (detail: RoadmapHistoryDetail) => {
  const input = detail.input;
  const summary = detail.summary;
  const result = summary?.result ?? null;

  return {
    target: formatCurrencyJPY(input.target_annual_dividend ?? null),
    monthly: formatCurrencyJPY(input.monthly_contribution ?? null),
    horizon: formatYears(input.horizon_years ?? null),
    yieldRate:
      typeof input.assumptions?.yield_rate === 'number'
        ? `${input.assumptions.yield_rate}%`
        : '-',
    growthRate:
      typeof input.assumptions?.dividend_growth_rate === 'number'
        ? `${input.assumptions.dividend_growth_rate}%`
        : '-',
    currentAnnual: formatCurrencyJPY(summary?.snapshot?.current_annual_dividend ?? null),
    targetAnnual: formatCurrencyJPY(result?.target_annual_dividend ?? null),
    endAnnual: formatCurrencyJPY(result?.end_annual_dividend ?? null),
  };
};

export function RoadmapHistoryDetailView() {
  const selectedDetail = useRoadmapHistoryStore((state) => state.selectedDetail);
  const isLoading = useRoadmapHistoryStore((state) => state.isLoading);

  if (isLoading && !selectedDetail) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedDetail) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">履歴を選択してください</p>
        </CardContent>
      </Card>
    );
  }

  const formatted = formatDetailValue(selectedDetail);

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div>
          <h2 className="text-lg font-semibold">履歴詳細</h2>
          <p className="text-xs text-muted-foreground">保存された入力と結果を表示します。</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">入力条件</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <SummaryItem label="年間配当ゴール" value={formatted.target} />
            <SummaryItem label="毎月の追加投資額" value={formatted.monthly} />
            <SummaryItem label="期間" value={formatted.horizon} />
            <SummaryItem label="想定利回り" value={formatted.yieldRate} />
            <SummaryItem label="想定増配率" value={formatted.growthRate} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">サマリー</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <SummaryItem label="現在の年間配当" value={formatted.currentAnnual} />
            <SummaryItem label="配当ゴール" value={formatted.targetAnnual} />
            <SummaryItem label="最終年の年間配当" value={formatted.endAnnual} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">シリーズ</h3>
          {selectedDetail.series.length === 0 ? (
            <p className="text-sm text-muted-foreground">データがありません。</p>
          ) : (
            <div className="mt-2 space-y-2">
              {selectedDetail.series.map((point) => (
                <div key={point.year} className="flex items-center justify-between text-sm">
                  <span>{point.year}年</span>
                  <span className="font-medium">
                    {formatCurrencyJPY(point.annual_dividend)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
