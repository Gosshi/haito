import { describe, it, expect } from 'vitest';
import {
  calculateGoalProgress,
  type GoalProgressInput,
  type GoalProgress,
} from './goal-progress';

describe('calculateGoalProgress', () => {
  describe('通常ケース（目標設定あり）', () => {
    it('達成率50%のケースを正しく計算する', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 750000,
        goalAmount: 1500000,
        goalDeadlineYear: 2032,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      expect(result.hasGoal).toBe(true);
      expect(result.achievementRate).toBe(50);
      expect(result.progressBarValue).toBe(50);
      expect(result.remainingDividend).toBe(750000);
      expect(result.requiredInvestment).toBe(18750000); // 750000 / 0.04
      expect(result.remainingYears).toBe(6);
      expect(result.isDeadlineExceeded).toBe(false);
    });

    it('達成率12%のケースを正しく計算する', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 180000,
        goalAmount: 1500000,
        goalDeadlineYear: 2032,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      expect(result.hasGoal).toBe(true);
      expect(result.achievementRate).toBe(12);
      expect(result.progressBarValue).toBe(12);
      expect(result.remainingDividend).toBe(1320000);
      expect(result.requiredInvestment).toBe(33000000); // 1320000 / 0.04
    });
  });

  describe('100%超過ケース', () => {
    it('達成率120%を正しく計算し、プログレスバーは100にクランプする', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 1800000,
        goalAmount: 1500000,
        goalDeadlineYear: null,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      expect(result.hasGoal).toBe(true);
      expect(result.achievementRate).toBe(120);
      expect(result.progressBarValue).toBe(100);
      expect(result.remainingDividend).toBe(0); // 達成済みなので0
      expect(result.requiredInvestment).toBe(0); // 達成済みなので0
    });

    it('達成率100%ちょうどの場合は残り投資額が0になる', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 1500000,
        goalAmount: 1500000,
        goalDeadlineYear: null,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      expect(result.achievementRate).toBe(100);
      expect(result.progressBarValue).toBe(100);
      expect(result.remainingDividend).toBe(0);
      expect(result.requiredInvestment).toBe(0);
    });
  });

  describe('目標未設定ケース', () => {
    it('goalAmountがnullの場合はhasGoal=falseを返す', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 180000,
        goalAmount: null,
        goalDeadlineYear: null,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      expect(result.hasGoal).toBe(false);
      expect(result.achievementRate).toBe(0);
      expect(result.progressBarValue).toBe(0);
      expect(result.remainingDividend).toBe(0);
      expect(result.requiredInvestment).toBe(0);
      expect(result.remainingYears).toBeNull();
      expect(result.isDeadlineExceeded).toBe(false);
    });

    it('goalAmountが0の場合はhasGoal=falseを返す', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 180000,
        goalAmount: 0,
        goalDeadlineYear: 2030,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      expect(result.hasGoal).toBe(false);
    });

    it('goalAmountが負の値の場合はhasGoal=falseを返す', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 180000,
        goalAmount: -100,
        goalDeadlineYear: 2030,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      expect(result.hasGoal).toBe(false);
    });
  });

  describe('期限関連ケース', () => {
    it('期限未設定の場合はremainingYears=nullを返す', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 180000,
        goalAmount: 1500000,
        goalDeadlineYear: null,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      expect(result.hasGoal).toBe(true);
      expect(result.remainingYears).toBeNull();
      expect(result.isDeadlineExceeded).toBe(false);
    });

    it('期限超過の場合はisDeadlineExceeded=trueを返す', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 180000,
        goalAmount: 1500000,
        goalDeadlineYear: 2025,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      expect(result.remainingYears).toBeNull();
      expect(result.isDeadlineExceeded).toBe(true);
    });

    it('現在年と期限年が同じ場合は残り0年を返す', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 180000,
        goalAmount: 1500000,
        goalDeadlineYear: 2026,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      expect(result.remainingYears).toBe(0);
      expect(result.isDeadlineExceeded).toBe(false);
    });
  });

  describe('追加投資試算ケース', () => {
    it('利回り4%想定で必要投資額を計算する', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 100000,
        goalAmount: 500000,
        goalDeadlineYear: null,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      // 残り配当: 500000 - 100000 = 400000
      // 必要投資額: 400000 / 0.04 = 10000000
      expect(result.remainingDividend).toBe(400000);
      expect(result.requiredInvestment).toBe(10000000);
    });

    it('currentAnnualDividendが0の場合も正しく計算する', () => {
      const input: GoalProgressInput = {
        currentAnnualDividend: 0,
        goalAmount: 1000000,
        goalDeadlineYear: null,
        currentYear: 2026,
      };

      const result = calculateGoalProgress(input);

      expect(result.achievementRate).toBe(0);
      expect(result.progressBarValue).toBe(0);
      expect(result.remainingDividend).toBe(1000000);
      expect(result.requiredInvestment).toBe(25000000); // 1000000 / 0.04
    });
  });
});
