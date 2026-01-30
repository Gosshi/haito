import type { AccountType } from '../holdings/types';

export type DashboardHolding = {
  id: string;
  stock_code: string;
  stock_name: string | null;
  shares: number;
  acquisition_price: number | null;
  account_type: AccountType;
  annual_dividend: number | null;
};

export type DashboardData = {
  holdings: DashboardHolding[];
  missingDividendCodes: string[];
};
