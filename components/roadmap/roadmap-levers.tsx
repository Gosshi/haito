'use client';

import type { DividendGoalRecommendation } from '../../lib/simulations/types';
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

export function RoadmapLevers() {
  const response = useRoadmapStore((state) => state.response);
  const isLoading = useRoadmapStore((state) => state.isLoading);

  const recommendations = response?.recommendations ?? [];
  const items = (Array.isArray(recommendations) ? recommendations : []).slice(0, 2);

  return (
    <Card>
      <CardContent className="py-6">
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
            {items.map((recommendation, index) => (
              <div
                key={`roadmap-recommendation-${index}`}
                data-testid="roadmap-recommendation-card"
                className="rounded-md border p-4"
              >
                <p className="text-sm font-medium">レバー {index + 1}</p>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                  {stringifyRecommendation(recommendation)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
