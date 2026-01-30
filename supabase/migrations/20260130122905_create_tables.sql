CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_code VARCHAR(10) NOT NULL,
  stock_name VARCHAR(100),
  shares INTEGER NOT NULL,
  acquisition_price DECIMAL(10,2),
  account_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, stock_code, account_type)
);

CREATE TABLE dividend_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_code VARCHAR(10) NOT NULL UNIQUE,
  stock_name VARCHAR(100),
  annual_dividend DECIMAL(10,2),
  dividend_yield DECIMAL(5,2),
  ex_dividend_months INTEGER[],
  payment_months INTEGER[],
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  annual_dividend_goal DECIMAL(12,2),
  display_currency VARCHAR(3) DEFAULT 'JPY',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX holdings_user_id_idx ON holdings (user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER holdings_set_updated_at
BEFORE UPDATE ON holdings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_settings_set_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
