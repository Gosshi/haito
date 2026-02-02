import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateGoalSettings, getCurrentYear } from './goal-form';

describe('validateGoalSettings', () => {
  const currentYear = new Date().getFullYear();

  describe('タスク5.2: 目標額のバリデーション', () => {
    it('空文字列の場合はエラーなし', () => {
      const result = validateGoalSettings('', '');
      expect(result.annualDividendGoal).toBeUndefined();
    });

    it('0の場合はエラーなし', () => {
      const result = validateGoalSettings('0', '');
      expect(result.annualDividendGoal).toBeUndefined();
    });

    it('正の整数の場合はエラーなし', () => {
      const result = validateGoalSettings('1500000', '');
      expect(result.annualDividendGoal).toBeUndefined();
    });

    it('負の数の場合はエラー', () => {
      const result = validateGoalSettings('-100', '');
      expect(result.annualDividendGoal).toBe('目標額は0以上の整数を入力してください');
    });

    it('小数の場合はエラー', () => {
      const result = validateGoalSettings('100.5', '');
      expect(result.annualDividendGoal).toBe('目標額は0以上の整数を入力してください');
    });

    it('数値以外の場合はエラー', () => {
      const result = validateGoalSettings('abc', '');
      expect(result.annualDividendGoal).toBe('目標額は0以上の整数を入力してください');
    });
  });

  describe('タスク5.2: 期限年のバリデーション', () => {
    it('空文字列の場合はエラーなし（未設定を許容）', () => {
      const result = validateGoalSettings('', '');
      expect(result.goalDeadlineYear).toBeUndefined();
    });

    it('現在年の場合はエラーなし', () => {
      const result = validateGoalSettings('', String(currentYear));
      expect(result.goalDeadlineYear).toBeUndefined();
    });

    it('現在年より未来の場合はエラーなし', () => {
      const result = validateGoalSettings('', String(currentYear + 5));
      expect(result.goalDeadlineYear).toBeUndefined();
    });

    it('2100年の場合はエラーなし', () => {
      const result = validateGoalSettings('', '2100');
      expect(result.goalDeadlineYear).toBeUndefined();
    });

    it('現在年より前の場合はエラー', () => {
      const result = validateGoalSettings('', String(currentYear - 1));
      expect(result.goalDeadlineYear).toContain('年以上2100年以下で入力してください');
    });

    it('2100より大きい場合はエラー', () => {
      const result = validateGoalSettings('', '2101');
      expect(result.goalDeadlineYear).toContain('年以上2100年以下で入力してください');
    });

    it('小数の場合はエラー', () => {
      const result = validateGoalSettings('', '2030.5');
      expect(result.goalDeadlineYear).toContain('年以上2100年以下で入力してください');
    });

    it('数値以外の場合はエラー', () => {
      const result = validateGoalSettings('', 'abc');
      expect(result.goalDeadlineYear).toContain('年以上2100年以下で入力してください');
    });
  });

  describe('タスク5.2: 複合バリデーション', () => {
    it('両方有効な場合はエラーなし', () => {
      const result = validateGoalSettings('1500000', '2030');
      expect(result.annualDividendGoal).toBeUndefined();
      expect(result.goalDeadlineYear).toBeUndefined();
      expect(Object.keys(result).length).toBe(0);
    });

    it('両方無効な場合は両方のエラーを返す', () => {
      const result = validateGoalSettings('-100', '2020');
      expect(result.annualDividendGoal).toBeDefined();
      expect(result.goalDeadlineYear).toBeDefined();
    });

    it('目標額のみ無効な場合は目標額のエラーのみ返す', () => {
      const result = validateGoalSettings('-100', '2030');
      expect(result.annualDividendGoal).toBeDefined();
      expect(result.goalDeadlineYear).toBeUndefined();
    });

    it('期限年のみ無効な場合は期限年のエラーのみ返す', () => {
      const result = validateGoalSettings('1500000', '2020');
      expect(result.annualDividendGoal).toBeUndefined();
      expect(result.goalDeadlineYear).toBeDefined();
    });
  });
});

describe('getCurrentYear', () => {
  it('現在年を返す', () => {
    const result = getCurrentYear();
    expect(result).toBe(new Date().getFullYear());
  });
});
