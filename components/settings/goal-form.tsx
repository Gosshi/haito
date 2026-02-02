'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settings-store';
import { pushToast } from '../../stores/toast-store';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

interface FormErrors {
  annualDividendGoal?: string;
  goalDeadlineYear?: string;
}

const getCurrentYear = () => new Date().getFullYear();

const validateGoalSettings = (
  annualDividendGoal: string,
  goalDeadlineYear: string
): FormErrors => {
  const errors: FormErrors = {};
  const currentYear = getCurrentYear();

  if (annualDividendGoal !== '') {
    const goalValue = parseFloat(annualDividendGoal);
    if (isNaN(goalValue) || goalValue < 0 || !Number.isInteger(goalValue)) {
      errors.annualDividendGoal = '目標額は0以上の整数を入力してください';
    }
  }

  if (goalDeadlineYear !== '') {
    const yearValue = parseFloat(goalDeadlineYear);
    if (
      isNaN(yearValue) ||
      !Number.isInteger(yearValue) ||
      yearValue < currentYear ||
      yearValue > 2100
    ) {
      errors.goalDeadlineYear = `期限年は${currentYear}年以上2100年以下で入力してください`;
    }
  }

  return errors;
};

export function GoalForm() {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const clearSettings = useSettingsStore((state) => state.clearSettings);

  const [annualDividendGoal, setAnnualDividendGoal] = useState('');
  const [goalDeadlineYear, setGoalDeadlineYear] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (settings) {
      setAnnualDividendGoal(
        settings.annual_dividend_goal !== null
          ? String(settings.annual_dividend_goal)
          : ''
      );
      setGoalDeadlineYear(
        settings.goal_deadline_year !== null
          ? String(settings.goal_deadline_year)
          : ''
      );
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateGoalSettings(
      annualDividendGoal,
      goalDeadlineYear
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const result = await updateSettings({
      annual_dividend_goal:
        annualDividendGoal !== '' ? parseInt(annualDividendGoal, 10) : null,
      goal_deadline_year:
        goalDeadlineYear !== '' ? parseInt(goalDeadlineYear, 10) : null,
    });

    setIsSubmitting(false);

    if (result.ok) {
      pushToast('設定を保存しました', 'success');
    }
  };

  const handleClear = async () => {
    const result = await clearSettings();

    if (result.ok) {
      setAnnualDividendGoal('');
      setGoalDeadlineYear('');
      setErrors({});
      pushToast('目標をクリアしました', 'success');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">目標設定</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="annualDividendGoal">年間配当目標額（円）</Label>
            <Input
              id="annualDividendGoal"
              type="number"
              value={annualDividendGoal}
              onChange={(e) => setAnnualDividendGoal(e.target.value)}
              placeholder="例: 1000000"
            />
            {errors.annualDividendGoal && (
              <p className="text-sm text-red-500">{errors.annualDividendGoal}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="goalDeadlineYear">目標達成期限（年）</Label>
            <Input
              id="goalDeadlineYear"
              type="number"
              value={goalDeadlineYear}
              onChange={(e) => setGoalDeadlineYear(e.target.value)}
              placeholder="例: 2030"
            />
            {errors.goalDeadlineYear && (
              <p className="text-sm text-red-500">{errors.goalDeadlineYear}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isSubmitting}
            >
              目標をクリア
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
