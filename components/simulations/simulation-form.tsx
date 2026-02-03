'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  DividendGoalRequest,
  DividendGoalSnapshot,
  TaxMode,
} from '../../lib/simulations/types';
import type { UserSettings } from '../../lib/settings/types';
import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { useSettingsStore } from '../../stores/settings-store';
import { useSimulationStore } from '../../stores/simulation-store';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectItem } from '../ui/select';

type SimulationFormValues = {
  targetAnnualDividend: string;
  monthlyContribution: string;
  horizonYears: string;
  yieldRate: string;
  dividendGrowthRate: string;
  taxMode: TaxMode;
};

type SliderConfig = {
  min: number;
  max: number;
  step: number;
};

const sliderConfigs: Record<
  Exclude<keyof SimulationFormValues, 'taxMode'>,
  SliderConfig
> = {
  targetAnnualDividend: { min: 0, max: 5000000, step: 10000 },
  monthlyContribution: { min: 0, max: 200000, step: 1000 },
  horizonYears: { min: 0, max: 40, step: 1 },
  yieldRate: { min: 0, max: 10, step: 0.1 },
  dividendGrowthRate: { min: 0, max: 10, step: 0.1 },
};

export const getCurrentYear = () => new Date().getFullYear();

const parseNumber = (value: string): number | null => {
  if (value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const stringifyNumber = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '';
  }
  return String(value);
};

const resolveHorizonYears = (
  goalDeadlineYear: number | null | undefined,
  currentYear: number
): number | null => {
  if (typeof goalDeadlineYear !== 'number') {
    return null;
  }
  const diff = goalDeadlineYear - currentYear;
  return diff > 0 ? diff : null;
};

const buildInitialValues = (
  settings: UserSettings | null,
  snapshot: DividendGoalSnapshot | null,
  currentYear: number
): SimulationFormValues => {
  const targetAnnualDividend =
    settings?.annual_dividend_goal ??
    snapshot?.current_annual_dividend ??
    null;
  const horizonYears = resolveHorizonYears(
    settings?.goal_deadline_year ?? null,
    currentYear
  );
  const yieldRate = snapshot?.current_yield_rate ?? null;

  return {
    targetAnnualDividend: stringifyNumber(targetAnnualDividend),
    monthlyContribution: '',
    horizonYears: stringifyNumber(horizonYears),
    yieldRate: stringifyNumber(yieldRate),
    dividendGrowthRate: '',
    taxMode: 'after_tax',
  };
};

const resolveSliderValue = (value: string, config: SliderConfig): number => {
  const parsed = parseNumber(value);
  if (parsed === null) {
    return config.min;
  }
  return Math.min(Math.max(parsed, config.min), config.max);
};

const buildRequest = (values: SimulationFormValues): DividendGoalRequest | null => {
  const targetAnnualDividend = parseNumber(values.targetAnnualDividend);
  const monthlyContribution = parseNumber(values.monthlyContribution);
  const horizonYears = parseNumber(values.horizonYears);
  const yieldRate = parseNumber(values.yieldRate);
  const dividendGrowthRate = parseNumber(values.dividendGrowthRate);

  if (
    targetAnnualDividend === null ||
    monthlyContribution === null ||
    horizonYears === null ||
    yieldRate === null ||
    dividendGrowthRate === null
  ) {
    return null;
  }

  return {
    target_annual_dividend: targetAnnualDividend,
    monthly_contribution: monthlyContribution,
    horizon_years: horizonYears,
    assumptions: {
      yield_rate: yieldRate,
      dividend_growth_rate: dividendGrowthRate,
      tax_mode: values.taxMode,
    },
  };
};

export function SimulationForm() {
  const settings = useSettingsStore((state) => state.settings);
  const response = useSimulationStore((state) => state.response);
  const runSimulation = useSimulationStore((state) => state.runSimulation);
  const isLoading = useSimulationStore((state) => state.isLoading);

  const snapshot = response?.snapshot ?? null;
  const [values, setValues] = useState<SimulationFormValues>(() =>
    buildInitialValues(settings, snapshot, getCurrentYear())
  );
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isDirty) {
      return;
    }
    setValues(buildInitialValues(settings, snapshot, getCurrentYear()));
  }, [settings, snapshot, isDirty]);

  const request = useMemo(() => buildRequest(values), [values]);
  const isReady = request !== null;

  const handleFieldChange = (
    field: keyof SimulationFormValues
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setIsDirty(true);
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextRequest = buildRequest(values);
    if (!nextRequest) {
      return;
    }
    void runSimulation(nextRequest);
  };

  const currentAnnualDividend = snapshot?.current_annual_dividend ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">シミュレーション条件</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {typeof currentAnnualDividend === 'number' && (
            <p className="text-sm text-muted-foreground">
              現在の年間配当: {formatCurrencyJPY(currentAnnualDividend)}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="targetAnnualDividend">年間配当目標額（円）</Label>
            <Input
              id="targetAnnualDividend"
              type="number"
              value={values.targetAnnualDividend}
              onChange={handleFieldChange('targetAnnualDividend')}
              placeholder="例: 1000000"
            />
            <input
              aria-label="年間配当目標額スライダー"
              type="range"
              min={sliderConfigs.targetAnnualDividend.min}
              max={sliderConfigs.targetAnnualDividend.max}
              step={sliderConfigs.targetAnnualDividend.step}
              value={resolveSliderValue(
                values.targetAnnualDividend,
                sliderConfigs.targetAnnualDividend
              )}
              onChange={handleFieldChange('targetAnnualDividend')}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyContribution">月次入金額（円）</Label>
            <Input
              id="monthlyContribution"
              type="number"
              value={values.monthlyContribution}
              onChange={handleFieldChange('monthlyContribution')}
              placeholder="例: 30000"
            />
            <input
              aria-label="月次入金額スライダー"
              type="range"
              min={sliderConfigs.monthlyContribution.min}
              max={sliderConfigs.monthlyContribution.max}
              step={sliderConfigs.monthlyContribution.step}
              value={resolveSliderValue(
                values.monthlyContribution,
                sliderConfigs.monthlyContribution
              )}
              onChange={handleFieldChange('monthlyContribution')}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="horizonYears">運用期間（年）</Label>
            <Input
              id="horizonYears"
              type="number"
              value={values.horizonYears}
              onChange={handleFieldChange('horizonYears')}
              placeholder="例: 5"
            />
            <input
              aria-label="運用期間スライダー"
              type="range"
              min={sliderConfigs.horizonYears.min}
              max={sliderConfigs.horizonYears.max}
              step={sliderConfigs.horizonYears.step}
              value={resolveSliderValue(
                values.horizonYears,
                sliderConfigs.horizonYears
              )}
              onChange={handleFieldChange('horizonYears')}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yieldRate">想定利回り（%）</Label>
            <Input
              id="yieldRate"
              type="number"
              value={values.yieldRate}
              onChange={handleFieldChange('yieldRate')}
              placeholder="例: 3.5"
            />
            <input
              aria-label="想定利回りスライダー"
              type="range"
              min={sliderConfigs.yieldRate.min}
              max={sliderConfigs.yieldRate.max}
              step={sliderConfigs.yieldRate.step}
              value={resolveSliderValue(values.yieldRate, sliderConfigs.yieldRate)}
              onChange={handleFieldChange('yieldRate')}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dividendGrowthRate">想定増配率（%）</Label>
            <Input
              id="dividendGrowthRate"
              type="number"
              value={values.dividendGrowthRate}
              onChange={handleFieldChange('dividendGrowthRate')}
              placeholder="例: 2"
            />
            <input
              aria-label="想定増配率スライダー"
              type="range"
              min={sliderConfigs.dividendGrowthRate.min}
              max={sliderConfigs.dividendGrowthRate.max}
              step={sliderConfigs.dividendGrowthRate.step}
              value={resolveSliderValue(
                values.dividendGrowthRate,
                sliderConfigs.dividendGrowthRate
              )}
              onChange={handleFieldChange('dividendGrowthRate')}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxMode">税モード</Label>
            <Select
              id="taxMode"
              value={values.taxMode}
              onChange={handleFieldChange('taxMode')}
            >
              <SelectItem value="after_tax">税引後</SelectItem>
              <SelectItem value="pretax">税引前</SelectItem>
            </Select>
          </div>

          <Button type="submit" disabled={!isReady || isLoading}>
            {isLoading ? '計算中...' : 'シミュレーション'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
