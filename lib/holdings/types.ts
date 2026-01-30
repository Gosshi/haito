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

export type HoldingFieldErrors = {
  shares?: string;
  acquisition_price?: string;
  account_type?: string;
};

export type HoldingUpdate = {
  shares: number;
  acquisition_price?: number | null;
  account_type: AccountType;
};

export type UpdateHoldingInput = HoldingUpdate & {
  id: string;
};

export type DeleteHoldingInput = {
  id: string;
};

export type HoldingEditResult = {
  errors: HoldingFieldErrors;
  value?: HoldingUpdate;
};
