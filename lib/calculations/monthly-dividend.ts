import type { AccountType } from '../holdings/types';
import type {
  CalendarHolding,
  MonthData,
  MonthDividendEntry,
  MonthlyDividendResult,
  UnknownMonthHolding,
} from '../calendar/types';

const SPECIFIC_TAX_RATE = 0.20315;

type SupportedAccountType = Extract<
  AccountType,
  'specific' | 'nisa_growth' | 'nisa_tsumitate'
>;

const SUPPORTED_ACCOUNT_TYPES: SupportedAccountType[] = [
  'specific',
  'nisa_growth',
  'nisa_tsumitate',
];

const isSupportedAccountType = (
  value: AccountType
): value is SupportedAccountType =>
  SUPPORTED_ACCOUNT_TYPES.includes(value as SupportedAccountType);

const calculateAfterTax = (
  preTaxAmount: number,
  accountType: AccountType
): number => {
  if (!isSupportedAccountType(accountType)) {
    return 0;
  }

  const taxRate = accountType === 'specific' ? SPECIFIC_TAX_RATE : 0;
  return Math.floor(preTaxAmount * (1 - taxRate));
};

const toNumber = (value: number | null): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const hasValidPaymentMonths = (
  paymentMonths: number[] | null
): paymentMonths is number[] =>
  Array.isArray(paymentMonths) && paymentMonths.length > 0;

const buildEmptyMonths = (): MonthData[] =>
  Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    entries: [],
    total: 0,
  }));

export const calculateMonthlyDividends = (
  holdings: CalendarHolding[]
): MonthlyDividendResult => {
  const months = buildEmptyMonths();
  const unknownMonthHoldings: UnknownMonthHolding[] = [];
  let unknownMonthTotal = 0;
  let yearTotal = 0;

  holdings.forEach((holding) => {
    if (!isSupportedAccountType(holding.account_type)) {
      return;
    }

    const annualDividend = toNumber(holding.annual_dividend);
    if (annualDividend <= 0) {
      return;
    }

    const annualPreTax = annualDividend * holding.shares;

    if (!hasValidPaymentMonths(holding.payment_months)) {
      const afterTax = calculateAfterTax(annualPreTax, holding.account_type);
      unknownMonthHoldings.push({
        stockCode: holding.stock_code,
        stockName: holding.stock_name,
        accountType: holding.account_type,
        annualDividendAfterTax: afterTax,
      });
      unknownMonthTotal += afterTax;
      return;
    }

    const paymentCount = holding.payment_months.length;
    const dividendPerPayment = annualDividend / paymentCount;
    const preTaxPerPayment = dividendPerPayment * holding.shares;
    const afterTaxPerPayment = calculateAfterTax(
      preTaxPerPayment,
      holding.account_type
    );

    holding.payment_months.forEach((month) => {
      if (month < 1 || month > 12) {
        return;
      }

      const monthIndex = month - 1;
      const entry: MonthDividendEntry = {
        stockCode: holding.stock_code,
        stockName: holding.stock_name,
        accountType: holding.account_type,
        amount: afterTaxPerPayment,
      };

      months[monthIndex].entries.push(entry);
      months[monthIndex].total += afterTaxPerPayment;
      yearTotal += afterTaxPerPayment;
    });
  });

  return {
    months,
    unknownMonthHoldings,
    unknownMonthTotal,
    yearTotal,
  };
};
