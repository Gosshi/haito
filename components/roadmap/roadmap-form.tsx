'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  AccountType,
  DividendGoalRequest,
  DividendGoalSnapshot,
  TaxMode,
} from '../../lib/simulations/types';
import type { UserSettings } from '../../lib/settings/types';
import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { useFeatureAccessStore } from '../../stores/feature-access-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useRoadmapStore } from '../../stores/roadmap-store';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectItem } from '../ui/select';

type RoadmapFormValues = {
  targetAnnualDividend: string;
  monthlyContribution: string;
  horizonYears: string;
  yieldRate: string;
  dividendGrowthRate: string;
  reinvestRate: string;
  accountType: AccountType;
  taxMode: TaxMode;
};

type SliderConfig = {
  min: number;
  max: number;
  step: number;
};

type SliderField =
  | 'targetAnnualDividend'
  | 'monthlyContribution'
  | 'horizonYears'
  | 'yieldRate'
  | 'dividendGrowthRate'
  | 'reinvestRate';

type RoadmapFieldErrors = Partial<Record<SliderField, string>>;

const sliderConfigs: Record<SliderField, SliderConfig> = {
  targetAnnualDividend: { min: 0, max: 5000000, step: 10000 },
  monthlyContribution: { min: 0, max: 200000, step: 1000 },
  horizonYears: { min: 0, max: 40, step: 1 },
  yieldRate: { min: 0, max: 10, step: 0.1 },
  dividendGrowthRate: { min: 0, max: 10, step: 0.1 },
  reinvestRate: { min: 0, max: 1, step: 0.05 },
};

const defaultValues = {
  targetAnnualDividend: 1000000,
  monthlyContribution: 30000,
  horizonYears: 10,
  yieldRate: 3.0,
  dividendGrowthRate: 1.0,
  reinvestRate: 1.0,
  accountType: 'nisa' as const,
  taxMode: 'after_tax' as const,
};

const invalidNumberMessage = '数値で入力してください';

const getCurrentYear = () => new Date().getFullYear();

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

const getStepPrecision = (step: number): number => {
  const stepText = String(step);
  const decimalIndex = stepText.indexOf('.');
  return decimalIndex === -1 ? 0 : stepText.length - decimalIndex - 1;
};

const clampToRange = (value: number, config: SliderConfig): number =>
  Math.min(Math.max(value, config.min), config.max);

const alignToStep = (value: number, config: SliderConfig): number => {
  const clamped = clampToRange(value, config);
  const steps = Math.round((clamped - config.min) / config.step);
  const aligned = config.min + steps * config.step;
  const precision = getStepPrecision(config.step);
  const rounded = Number(aligned.toFixed(precision));
  return clampToRange(rounded, config);
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

const resolveInitialNumber = (
  value: number | null | undefined,
  fallback: number,
  config: SliderConfig
): string => {
  const resolved =
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return stringifyNumber(alignToStep(resolved, config));
};

const buildInitialValues = (
  settings: UserSettings | null,
  snapshot: DividendGoalSnapshot | null,
  currentYear: number
): RoadmapFormValues => {
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
    targetAnnualDividend: resolveInitialNumber(
      targetAnnualDividend,
      defaultValues.targetAnnualDividend,
      sliderConfigs.targetAnnualDividend
    ),
    monthlyContribution: resolveInitialNumber(
      null,
      defaultValues.monthlyContribution,
      sliderConfigs.monthlyContribution
    ),
    horizonYears: resolveInitialNumber(
      horizonYears,
      defaultValues.horizonYears,
      sliderConfigs.horizonYears
    ),
    yieldRate: resolveInitialNumber(
      yieldRate,
      defaultValues.yieldRate,
      sliderConfigs.yieldRate
    ),
    dividendGrowthRate: resolveInitialNumber(
      null,
      defaultValues.dividendGrowthRate,
      sliderConfigs.dividendGrowthRate
    ),
    reinvestRate: resolveInitialNumber(
      defaultValues.reinvestRate,
      defaultValues.reinvestRate,
      sliderConfigs.reinvestRate
    ),
    accountType: defaultValues.accountType,
    taxMode: defaultValues.taxMode,
  };
};

const resolveSliderValue = (value: string, config: SliderConfig): number => {
  const parsed = parseNumber(value);
  if (parsed === null) {
    return config.min;
  }
  return alignToStep(parsed, config);
};

const normalizeNumberInput = (
  value: string,
  config: SliderConfig
): { value: string; error: string | null } => {
  if (value.trim() === '') {
    return { value: '', error: invalidNumberMessage };
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return { value, error: invalidNumberMessage };
  }
  const aligned = alignToStep(parsed, config);
  return { value: stringifyNumber(aligned), error: null };
};

const buildRequest = (values: RoadmapFormValues): DividendGoalRequest | null => {
  const targetAnnualDividend = parseNumber(values.targetAnnualDividend);
  const monthlyContribution = parseNumber(values.monthlyContribution);
  const horizonYears = parseNumber(values.horizonYears);
  const yieldRate = parseNumber(values.yieldRate);
  const dividendGrowthRate = parseNumber(values.dividendGrowthRate);
  const reinvestRate = parseNumber(values.reinvestRate);

  if (
    targetAnnualDividend === null ||
    monthlyContribution === null ||
    horizonYears === null ||
    yieldRate === null ||
    dividendGrowthRate === null ||
    reinvestRate === null
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
      reinvest_rate: reinvestRate,
      account_type: values.accountType,
      tax_mode: values.taxMode,
    },
  };
};

export function RoadmapForm() {
  const settings = useSettingsStore((state) => state.settings);
  const response = useRoadmapStore((state) => state.response);
  const runRoadmap = useRoadmapStore((state) => state.runRoadmap);
  const isLoading = useRoadmapStore((state) => state.isLoading);
  const billingStatus = useFeatureAccessStore((state) => state.status);
  const refreshStatus = useFeatureAccessStore((state) => state.refreshStatus);

  const snapshot = response?.snapshot ?? null;
  const [values, setValues] = useState<RoadmapFormValues>(() =>
    buildInitialValues(settings, snapshot, getCurrentYear())
  );
  const [isDirty, setIsDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RoadmapFieldErrors>({});
  const isPremium = billingStatus?.plan === 'premium' && billingStatus.is_active;
  const isLocked = !isPremium;

  useEffect(() => {
    if (isDirty) {
      return;
    }
    setValues(buildInitialValues(settings, snapshot, getCurrentYear()));
    setFieldErrors({});
  }, [settings, snapshot, isDirty]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!isLocked) {
      return;
    }
    setValues((prev) => ({
      ...prev,
      reinvestRate: stringifyNumber(defaultValues.reinvestRate),
      accountType: defaultValues.accountType,
    }));
    setFieldErrors((prev) => {
      if (!prev.reinvestRate) {
        return prev;
      }
      const next = { ...prev };
      delete next.reinvestRate;
      return next;
    });
  }, [isLocked]);

  const request = useMemo(() => buildRequest(values), [values]);
  const isReady = request !== null && Object.keys(fieldErrors).length === 0;

  const handleFieldChange =
    (field: keyof RoadmapFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setIsDirty(true);
      if (field in sliderConfigs) {
        const config = sliderConfigs[field as SliderField];
        const normalized = normalizeNumberInput(event.target.value, config);
        setValues((prev) => ({ ...prev, [field]: normalized.value }));
        setFieldErrors((prev) => {
          const next = { ...prev };
          if (normalized.error) {
            next[field as SliderField] = normalized.error;
          } else {
            delete next[field as SliderField];
          }
          return next;
        });
        return;
      }
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextRequest = buildRequest(values);
    if (!nextRequest) {
      return;
    }
    void runRoadmap(nextRequest);
  };

  const currentAnnualDividend = snapshot?.current_annual_dividend ?? null;

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {typeof currentAnnualDividend === 'number' && (
            <p className="text-sm text-muted-foreground">
              現在の年間配当: {formatCurrencyJPY(currentAnnualDividend)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            前提条件に基づく試算です。入力はあとで変更できます。
          </p>

          <div className="space-y-2">
            <Label htmlFor="targetAnnualDividend">年間配当ゴール（円）</Label>
            <Input
              id="targetAnnualDividend"
              type="number"
              min={sliderConfigs.targetAnnualDividend.min}
              max={sliderConfigs.targetAnnualDividend.max}
              step={sliderConfigs.targetAnnualDividend.step}
              value={values.targetAnnualDividend}
              onChange={handleFieldChange('targetAnnualDividend')}
              placeholder="例: 1000000"
            />
            {fieldErrors.targetAnnualDividend && (
              <p className="text-sm text-red-600">
                {fieldErrors.targetAnnualDividend}
              </p>
            )}
            <input
              aria-label="年間配当ゴールスライダー"
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
            <Label htmlFor="monthlyContribution">毎月の追加投資額（円）</Label>
            <Input
              id="monthlyContribution"
              type="number"
              min={sliderConfigs.monthlyContribution.min}
              max={sliderConfigs.monthlyContribution.max}
              step={sliderConfigs.monthlyContribution.step}
              value={values.monthlyContribution}
              onChange={handleFieldChange('monthlyContribution')}
              placeholder="例: 30000"
            />
            {fieldErrors.monthlyContribution && (
              <p className="text-sm text-red-600">
                {fieldErrors.monthlyContribution}
              </p>
            )}
            <input
              aria-label="毎月の追加投資額スライダー"
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
            <Label htmlFor="horizonYears">期間（年）</Label>
            <Input
              id="horizonYears"
              type="number"
              min={sliderConfigs.horizonYears.min}
              max={sliderConfigs.horizonYears.max}
              step={sliderConfigs.horizonYears.step}
              value={values.horizonYears}
              onChange={handleFieldChange('horizonYears')}
              placeholder="例: 5"
            />
            {fieldErrors.horizonYears && (
              <p className="text-sm text-red-600">{fieldErrors.horizonYears}</p>
            )}
            <input
              aria-label="期間スライダー"
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
              min={sliderConfigs.yieldRate.min}
              max={sliderConfigs.yieldRate.max}
              step={sliderConfigs.yieldRate.step}
              value={values.yieldRate}
              onChange={handleFieldChange('yieldRate')}
              placeholder="例: 3.5"
            />
            {fieldErrors.yieldRate && (
              <p className="text-sm text-red-600">{fieldErrors.yieldRate}</p>
            )}
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
              min={sliderConfigs.dividendGrowthRate.min}
              max={sliderConfigs.dividendGrowthRate.max}
              step={sliderConfigs.dividendGrowthRate.step}
              value={values.dividendGrowthRate}
              onChange={handleFieldChange('dividendGrowthRate')}
              placeholder="例: 2"
            />
            {fieldErrors.dividendGrowthRate && (
              <p className="text-sm text-red-600">
                {fieldErrors.dividendGrowthRate}
              </p>
            )}
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

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">再投資（配当の使い道）</h3>
            <div className="space-y-2">
              <Label htmlFor="reinvestRate">再投資率（0.0〜1.0）</Label>
              <Input
                id="reinvestRate"
                type="number"
                min={sliderConfigs.reinvestRate.min}
                max={sliderConfigs.reinvestRate.max}
                step={sliderConfigs.reinvestRate.step}
                value={values.reinvestRate}
                onChange={handleFieldChange('reinvestRate')}
                disabled={isLocked}
                placeholder="例: 1.0"
              />
              {fieldErrors.reinvestRate && (
                <p className="text-sm text-red-600">
                  {fieldErrors.reinvestRate}
                </p>
              )}
              <input
                aria-label="再投資率スライダー"
                type="range"
                min={sliderConfigs.reinvestRate.min}
                max={sliderConfigs.reinvestRate.max}
                step={sliderConfigs.reinvestRate.step}
                value={resolveSliderValue(values.reinvestRate, sliderConfigs.reinvestRate)}
                onChange={handleFieldChange('reinvestRate')}
                className="w-full"
                disabled={isLocked}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType">税区分（NISA/課税）</Label>
              <Select
                id="accountType"
                value={values.accountType}
                onChange={handleFieldChange('accountType')}
                disabled={isLocked}
              >
                <SelectItem value="nisa">NISA</SelectItem>
                <SelectItem value="taxable">課税</SelectItem>
              </Select>
            </div>

            {isLocked && (
              <p className="text-xs text-muted-foreground">
                Freeでは再投資は100%・税区分はNISA固定で試算します
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              税率は簡易的に固定値で計算しています。入力前提に基づく試算です。
            </p>
          </section>

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
            {isLoading ? '計算中...' : 'ロードマップを試算'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
