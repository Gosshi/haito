'use client';

import type { DividendGoalResult } from '../../lib/simulations/types';
import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { useScenarioCompareStore } from '../../stores/scenario-compare-store';
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

export function ScenarioCompareSummary() {
  const response = useScenarioCompareStore((state) => state.response);
  const isLoading = useScenarioCompareStore((state) => state.isLoading);

  const scenarios = Array.isArray(response?.scenarios)
    ? response?.scenarios
    : [];

  return (
    <Card>
      <CardContent className="py-6">
        {isLoading && (
          <p className="text-sm text-muted-foreground">計算中...</p>
        )}
        {!isLoading && scenarios.length === 0 && (
          <p className="text-sm text-muted-foreground">
            比較結果がまだありません
          </p>
        )}
        {!isLoading && scenarios.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.scenario_id}
                className="rounded-md border p-4"
              >
                <p className="text-sm font-medium">{scenario.name}</p>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      ゴール到達までの年数
                    </p>
                    <p className="text-lg font-semibold">
                      {formatYearsToGoal(scenario.result ?? null)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      期末年間配当（試算）
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrencyJPY(
                        scenario.result?.end_annual_dividend ?? null
                      )}
                    </p>
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
