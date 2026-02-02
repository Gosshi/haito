'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { useSettingsStore } from '../../stores/settings-store';
import { calculateGoalProgress } from '../../lib/calculations/goal-progress';
import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';

type GoalProgressWidgetProps = {
  currentAnnualDividend: number;
  currentYear?: number;
};

export function GoalProgressWidget({
  currentAnnualDividend,
  currentYear = new Date().getFullYear(),
}: GoalProgressWidgetProps) {
  const settings = useSettingsStore((state) => state.settings);
  const isLoading = useSettingsStore((state) => state.isLoading);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>目標進捗</CardTitle>
        </CardHeader>
        <CardContent data-testid="loading-skeleton">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = calculateGoalProgress({
    currentAnnualDividend,
    goalAmount: settings?.annual_dividend_goal ?? null,
    goalDeadlineYear: settings?.goal_deadline_year ?? null,
    currentYear,
  });

  if (!progress.hasGoal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>目標進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">目標を設定しましょう</p>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              設定ページへ
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const showInvestmentEstimation = progress.achievementRate < 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>目標進捗</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">目標額</p>
              <p className="text-2xl font-semibold">
                {formatCurrencyJPY(settings?.annual_dividend_goal ?? 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">現在の年間配当</p>
              <p className="text-2xl font-semibold">
                {formatCurrencyJPY(currentAnnualDividend)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">達成率</span>
              <span className="text-lg font-semibold">{progress.achievementRate}%</span>
            </div>
            <Progress value={progress.progressBarValue} />
          </div>

          {progress.remainingYears !== null && (
            <p className="text-sm text-muted-foreground">
              残り{progress.remainingYears}年
            </p>
          )}

          {progress.isDeadlineExceeded && (
            <p className="text-sm text-destructive">期限を過ぎています</p>
          )}

          {showInvestmentEstimation && (
            <div className="mt-4 rounded-md border border-dashed p-4">
              <p className="text-sm font-medium">追加投資試算（利回り4%想定）</p>
              <div className="mt-2 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">残り必要配当額</span>
                  <span>{formatCurrencyJPY(progress.remainingDividend)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">必要投資額</span>
                  <span>{formatCurrencyJPY(progress.requiredInvestment)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
