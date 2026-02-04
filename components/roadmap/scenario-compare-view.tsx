'use client';

import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { useScenarioCompareStore } from '../../stores/scenario-compare-store';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ScenarioCompareChart } from './scenario-compare-chart';
import { ScenarioCompareSummary } from './scenario-compare-summary';

const formatYears = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }
  return `${value}年`;
};

export function ScenarioCompareView() {
  const input = useScenarioCompareStore((state) => state.input);
  const error = useScenarioCompareStore((state) => state.error);
  const isLoading = useScenarioCompareStore((state) => state.isLoading);
  const runScenarioCompare = useScenarioCompareStore(
    (state) => state.runScenarioCompare
  );

  const errorMessage = error?.error?.message;
  const hasInput = Boolean(input);

  const handleRunCompare = () => {
    if (!input) {
      return;
    }
    void runScenarioCompare(input);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">条件別ロードマップ比較</h2>
        <p className="text-xs text-muted-foreground">
          前提条件を変えた場合の試算比較です。特定の投資判断を勧めるものではありません。
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          {hasInput ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  年間配当ゴール
                </p>
                <p className="text-base font-semibold">
                  {formatCurrencyJPY(input?.target_annual_dividend ?? null)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  毎月の追加投資額
                </p>
                <p className="text-base font-semibold">
                  {formatCurrencyJPY(input?.monthly_contribution ?? null)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">期間</p>
                <p className="text-base font-semibold">
                  {formatYears(input?.horizon_years)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              比較条件がまだありません。単一シナリオで試算してから比較を実行してください。
            </p>
          )}

          <Button type="button" onClick={handleRunCompare} disabled={!hasInput || isLoading}>
            {isLoading ? '計算中...' : '条件別比較を試算'}
          </Button>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">比較サマリー</h3>
        <ScenarioCompareSummary />
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">配当の推移（比較）</h3>
        <ScenarioCompareChart />
      </section>
    </div>
  );
}
