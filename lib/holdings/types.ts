export type AccountType =
  | 'specific'
  | 'nisa_growth'
  | 'nisa_tsumitate'
  | 'nisa_legacy';

export type Holding = {
  id: string;
  user_id: string;
  stock_code: string;
  stock_name: string | null;
  shares: number;
  acquisition_price: number | null;
  account_type: AccountType;
  created_at: string | null;
  updated_at: string | null;
};

export type NewHolding = {
  stock_code: string;
  stock_name?: string;
  shares: number;
  acquisition_price?: number | null;
  account_type: AccountType;
};
