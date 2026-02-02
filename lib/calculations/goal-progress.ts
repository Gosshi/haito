export interface GoalProgressInput {
  currentAnnualDividend: number;
  goalAmount: number | null;
  goalDeadlineYear: number | null;
  currentYear: number;
}

export interface GoalProgress {
  hasGoal: boolean;
  achievementRate: number;
  progressBarValue: number;
  remainingDividend: number;
  requiredInvestment: number;
  remainingYears: number | null;
  isDeadlineExceeded: boolean;
}

const ASSUMED_YIELD_RATE = 0.04;

export const calculateGoalProgress = (input: GoalProgressInput): GoalProgress => {
  const { currentAnnualDividend, goalAmount, goalDeadlineYear, currentYear } = input;

  if (goalAmount === null || goalAmount <= 0) {
    return {
      hasGoal: false,
      achievementRate: 0,
      progressBarValue: 0,
      remainingDividend: 0,
      requiredInvestment: 0,
      remainingYears: null,
      isDeadlineExceeded: false,
    };
  }

  const achievementRate = Math.round((currentAnnualDividend / goalAmount) * 100);
  const progressBarValue = Math.min(achievementRate, 100);

  const isGoalAchieved = achievementRate >= 100;
  const remainingDividend = isGoalAchieved ? 0 : goalAmount - currentAnnualDividend;
  const requiredInvestment = isGoalAchieved ? 0 : remainingDividend / ASSUMED_YIELD_RATE;

  let remainingYears: number | null = null;
  let isDeadlineExceeded = false;

  if (goalDeadlineYear !== null) {
    if (currentYear > goalDeadlineYear) {
      isDeadlineExceeded = true;
    } else {
      remainingYears = goalDeadlineYear - currentYear;
    }
  }

  return {
    hasGoal: true,
    achievementRate,
    progressBarValue,
    remainingDividend,
    requiredInvestment,
    remainingYears,
    isDeadlineExceeded,
  };
};
