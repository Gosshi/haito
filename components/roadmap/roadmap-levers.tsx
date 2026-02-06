'use client';

import type { DividendGoalRecommendation } from '../../lib/simulations/types';
import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { formatPercent } from '../../lib/portfolio/format';
import { useRoadmapStore } from '../../stores/roadmap-store';
import { Card, CardContent } from '../ui/card';

const stringifyRecommendation = (
  recommendation: DividendGoalRecommendation
): string => {
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const getTextValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const formatSignedCurrency = (value: number): string => {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatCurrencyJPY(Math.abs(value))}`;
};

const formatSignedPercent = (value: number): string => {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatPercent(Math.abs(value))}`;
};

const formatDeltaValue = (delta: unknown): string | null => {
  if (!isRecord(delta)) {
    return null;
  }

  const monthlyContribution = delta.monthly_contribution;
  if (typeof monthlyContribution === 'number' && Number.isFinite(monthlyContribution)) {
    return formatSignedCurrency(monthlyContribution);
  }

  const yieldRate = delta.yield_rate;
  if (typeof yieldRate === 'number' && Number.isFinite(yieldRate)) {
    return formatSignedPercent(yieldRate);
  }

  return null;
};

const getRecommendationView = (
  recommendation: DividendGoalRecommendation
): { title: string | null; message: string | null; fallback: string | null } => {
  if (!isRecord(recommendation)) {
    return {
      title: null,
      message: null,
      fallback: stringifyRecommendation(recommendation),
    };
  }

  const title =
    getTextValue(recommendation.title) ?? getTextValue(recommendation.label);
  const message =
    getTextValue(recommendation.message) ??
    getTextValue(recommendation.description);

  if (title || message) {
    return { title, message, fallback: null };
  }

  return { title: null, message: null, fallback: stringifyRecommendation(recommendation) };
};

export function RoadmapLevers() {
  const response = useRoadmapStore((state) => state.response);
  const isLoading = useRoadmapStore((state) => state.isLoading);

  const recommendations = response?.recommendations ?? [];
  const items = (Array.isArray(recommendations) ? recommendations : []).slice(0, 2);

  return (
    <Card>
      <CardContent className="py-6">
        <p className="text-xs text-muted-foreground">
          感度チェックは前提条件を変えた試算差分です。
        </p>
        {isLoading && (
          <p className="text-sm text-muted-foreground">計算中...</p>
        )}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            レバーの結果がまだありません
          </p>
        )}
        {!isLoading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((recommendation, index) => {
              const view = getRecommendationView(recommendation);
              const deltaValue = formatDeltaValue(
                isRecord(recommendation) ? recommendation.delta : null
              );
              return (
                <div
                  key={`roadmap-recommendation-${index}`}
                  data-testid="roadmap-recommendation-card"
                  className="rounded-md border p-4"
                >
                  <p className="text-sm font-medium">レバー {index + 1}</p>
                  {view.title && (
                    <p className="mt-2 text-sm font-medium">{view.title}</p>
                  )}
                  {deltaValue && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      差分: {deltaValue}
                    </p>
                  )}
                  {view.message && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {view.message}
                    </p>
                  )}
                  {view.fallback && (
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                      {view.fallback}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
