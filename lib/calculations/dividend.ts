import type { DashboardHolding } from '../dashboard/types';
import type { AccountType } from '../holdings/types';

type SupportedAccountType = Extract<
  AccountType,
  'specific' | 'nisa_growth' | 'nisa_tsumitate' | 'nisa_legacy'
>;

export type AccountDividendSummary = {
  accountType: SupportedAccountType;
  preTax: number;
  afterTax: number;
};

export type DividendSummary = {
  totalPreTax: number;
  totalAfterTax: number;
  totalInvestment: number;
  dividendYield: number;
  accountSummaries: AccountDividendSummary[];
};

const SUPPORTED_ACCOUNT_TYPES: SupportedAccountType[] = [
  'specific',
  'nisa_growth',
  'nisa_tsumitate',
  'nisa_legacy',
];

const SPECIFIC_TAX_RATE = 0.20315;

const isSupportedAccountType = (
  value: AccountType
): value is SupportedAccountType =>
  SUPPORTED_ACCOUNT_TYPES.includes(value as SupportedAccountType);

const toNumber = (value: number | null): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const buildAccountTotals = (): Record<SupportedAccountType, number> => ({
  specific: 0,
  nisa_growth: 0,
  nisa_tsumitate: 0,
  nisa_legacy: 0,
});

export const calculateDividendSummary = (
  holdings: DashboardHolding[]
): DividendSummary => {
  const accountTotals = buildAccountTotals();
  let totalPreTax = 0;
  let totalInvestment = 0;
  let yieldDividendTotal = 0;

  holdings.forEach((holding) => {
    if (!isSupportedAccountType(holding.account_type)) {
      return;
    }

    const annualDividend = toNumber(holding.annual_dividend);
    const preTax = annualDividend * holding.shares;

    if (annualDividend > 0) {
      accountTotals[holding.account_type] += preTax;
      totalPreTax += preTax;
    }

    if (typeof holding.acquisition_price === 'number') {
      const investment = holding.acquisition_price * holding.shares;
      totalInvestment += investment;

      if (annualDividend > 0) {
        yieldDividendTotal += preTax;
      }
    }
  });

  const accountSummaries = SUPPORTED_ACCOUNT_TYPES.map((accountType) => {
    const preTax = accountTotals[accountType];
    const taxRate = accountType === 'specific' ? SPECIFIC_TAX_RATE : 0;
    const afterTax = Math.floor(preTax * (1 - taxRate));

    return {
      accountType,
      preTax,
      afterTax,
    };
  });

  const totalAfterTax = accountSummaries.reduce(
    (sum, entry) => sum + entry.afterTax,
    0
  );

  const dividendYield =
    totalInvestment > 0 ? (yieldDividendTotal / totalInvestment) * 100 : 0;

  return {
    totalPreTax,
    totalAfterTax,
    totalInvestment,
    dividendYield,
    accountSummaries,
  };
};
