import { describe, it, expect } from 'vitest';
import {
  calculateHoldingYield,
  calculatePortfolioYield,
  type HoldingYieldInput,
} from './portfolio-yield';

describe('calculateHoldingYield', () => {
  it('年間配当額・投資額・利回りを算出する', () => {
    const input: HoldingYieldInput = {
      stockCode: '7203',
      shares: 10,
      acquisitionPrice: 100,
      annualDividend: 50,
    };

    const result = calculateHoldingYield(input);

    expect(result).toEqual({
      stockCode: '7203',
      annualDividendAmount: 500,
      investmentAmount: 1000,
      yieldPercent: 50,
    });
  });

  it('取得単価が未設定の場合は利回りをnullにする', () => {
    const input: HoldingYieldInput = {
      stockCode: '8306',
      shares: 5,
      acquisitionPrice: null,
      annualDividend: 40,
    };

    const result = calculateHoldingYield(input);

    expect(result).toEqual({
      stockCode: '8306',
      annualDividendAmount: 200,
      investmentAmount: 0,
      yieldPercent: null,
    });
  });

  it('年間配当額が未設定の場合は利回りをnullにする', () => {
    const input: HoldingYieldInput = {
      stockCode: '2914',
      shares: 12,
      acquisitionPrice: 80,
      annualDividend: null,
    };

    const result = calculateHoldingYield(input);

    expect(result).toEqual({
      stockCode: '2914',
      annualDividendAmount: 0,
      investmentAmount: 960,
      yieldPercent: null,
    });
  });
});

describe('calculatePortfolioYield', () => {
  it('投資額で重み付けした平均利回りを算出する', () => {
    const inputs: HoldingYieldInput[] = [
      {
        stockCode: '7203',
        shares: 10,
        acquisitionPrice: 100,
        annualDividend: 50,
      },
      {
        stockCode: '8306',
        shares: 100,
        acquisitionPrice: 20,
        annualDividend: 10,
      },
    ];

    const result = calculatePortfolioYield(inputs);

    expect(result.totalDividendAmount).toBe(1500);
    expect(result.totalInvestmentAmount).toBe(3000);
    expect(result.averageYield).toBe(50);
  });

  it('取得単価または配当が未設定の銘柄は平均計算から除外する', () => {
    const inputs: HoldingYieldInput[] = [
      {
        stockCode: '7203',
        shares: 10,
        acquisitionPrice: 100,
        annualDividend: 50,
      },
      {
        stockCode: '9999',
        shares: 15,
        acquisitionPrice: null,
        annualDividend: 30,
      },
      {
        stockCode: '1111',
        shares: 20,
        acquisitionPrice: 40,
        annualDividend: null,
      },
    ];

    const result = calculatePortfolioYield(inputs);

    expect(result.totalDividendAmount).toBe(500);
    expect(result.totalInvestmentAmount).toBe(1000);
    expect(result.averageYield).toBe(50);
  });

  it('投資額が0の場合は平均利回りを0にする', () => {
    const inputs: HoldingYieldInput[] = [
      {
        stockCode: '7777',
        shares: 10,
        acquisitionPrice: null,
        annualDividend: null,
      },
    ];

    const result = calculatePortfolioYield(inputs);

    expect(result.totalInvestmentAmount).toBe(0);
    expect(result.averageYield).toBe(0);
  });
});
