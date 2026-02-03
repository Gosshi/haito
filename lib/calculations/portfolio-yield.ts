export type HoldingYieldInput = {
  stockCode: string;
  shares: number;
  acquisitionPrice: number | null;
  annualDividend: number | null;
};

export type HoldingYield = {
  stockCode: string;
  annualDividendAmount: number;
  investmentAmount: number;
  yieldPercent: number | null;
};

export type PortfolioYieldSummary = {
  averageYield: number;
  totalDividendAmount: number;
  totalInvestmentAmount: number;
};

const toNumber = (value: number | null): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const calculateHoldingYield = (
  input: HoldingYieldInput
): HoldingYield => {
  const annualDividend = toNumber(input.annualDividend);
  const acquisitionPrice = toNumber(input.acquisitionPrice);
  const shares = Number.isFinite(input.shares) ? input.shares : 0;

  const annualDividendAmount = annualDividend !== null ? annualDividend * shares : 0;
  const investmentAmount =
    acquisitionPrice !== null ? acquisitionPrice * shares : 0;
  const yieldPercent =
    annualDividend !== null && acquisitionPrice !== null
      ? (annualDividend / acquisitionPrice) * 100
      : null;

  return {
    stockCode: input.stockCode,
    annualDividendAmount,
    investmentAmount,
    yieldPercent,
  };
};

export const calculatePortfolioYield = (
  inputs: HoldingYieldInput[]
): PortfolioYieldSummary => {
  let totalDividendAmount = 0;
  let totalInvestmentAmount = 0;

  inputs.forEach((input) => {
    const holding = calculateHoldingYield(input);
    if (holding.yieldPercent !== null) {
      totalDividendAmount += holding.annualDividendAmount;
      totalInvestmentAmount += holding.investmentAmount;
    }
  });

  const averageYield =
    totalInvestmentAmount > 0
      ? (totalDividendAmount / totalInvestmentAmount) * 100
      : 0;

  return {
    averageYield,
    totalDividendAmount,
    totalInvestmentAmount,
  };
};
