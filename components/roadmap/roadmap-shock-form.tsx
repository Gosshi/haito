'use client';

import { useMemo, useState } from 'react';

import type { DividendGoalRequest } from '../../lib/simulations/types';
import { useRoadmapStore } from '../../stores/roadmap-store';
import { useRoadmapShockStore } from '../../stores/roadmap-shock-store';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const parseNumber = (value: string): number | null => {
  if (value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseYear = (value: string): number | null => {
  const parsed = parseNumber(value);
  if (parsed === null || !Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
};

const buildShockRequest = (
  baseInput: DividendGoalRequest | null,
  yearValue: number | null,
  rateValue: number | null
) => {
  if (!baseInput || yearValue === null || rateValue === null) {
    return null;
  }

  return {
    ...baseInput,
    shock: {
      year: yearValue,
      rate: rateValue,
    },
  };
};

export function RoadmapShockForm() {
  const baseInput = useRoadmapStore((state) => state.input);
  const runShock = useRoadmapShockStore((state) => state.runShock);
  const isLoading = useRoadmapShockStore((state) => state.isLoading);

  const [year, setYear] = useState('');
  const [rate, setRate] = useState('');

  const yearValue = useMemo(() => parseYear(year), [year]);
  const rateValue = useMemo(() => parseNumber(rate), [rate]);

  const request = useMemo(
    () => buildShockRequest(baseInput, yearValue, rateValue),
    [baseInput, yearValue, rateValue]
  );
  const isReady = request !== null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!request) {
      return;
    }
    void runShock(request);
  };

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shockYear">減配年</Label>
            <Input
              id="shockYear"
              type="number"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder="例: 2027"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shockRate">減配率（%）</Label>
            <Input
              id="shockRate"
              type="number"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder="例: 20"
            />
          </div>

          <Button type="submit" disabled={!isReady || isLoading}>
            {isLoading ? '計算中...' : 'ストレステストを実行'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
