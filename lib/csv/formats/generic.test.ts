import { describe, it, expect } from 'vitest';
import { GENERIC_HEADERS, mapToHolding } from './generic';
import type { CsvRow } from '../types';

describe('generic format', () => {
  describe('GENERIC_HEADERS', () => {
    it('期待するヘッダーを定義している', () => {
      expect(GENERIC_HEADERS).toEqual([
        '銘柄コード',
        '銘柄名',
        '保有株数',
        '取得単価',
        '口座種別',
      ]);
    });
  });

  describe('mapToHolding', () => {
    it('行データをNewHoldingに変換する', () => {
      const row: CsvRow = {
        銘柄コード: '7203',
        銘柄名: 'トヨタ自動車',
        保有株数: '100',
        取得単価: '2500.5',
        口座種別: 'specific',
      };

      const result = mapToHolding(row);

      expect(result).toEqual({
        stock_code: '7203',
        stock_name: 'トヨタ自動車',
        shares: 100,
        acquisition_price: 2500.5,
        account_type: 'specific',
      });
    });

    it('銘柄名が空の場合はundefinedを返す', () => {
      const row: CsvRow = {
        銘柄コード: '7203',
        銘柄名: '',
        保有株数: '100',
        取得単価: '2500',
        口座種別: 'nisa_growth',
      };

      const result = mapToHolding(row);

      expect(result.stock_name).toBeUndefined();
    });

    it('取得単価が空の場合はundefinedを返す', () => {
      const row: CsvRow = {
        銘柄コード: '7203',
        銘柄名: 'トヨタ自動車',
        保有株数: '100',
        取得単価: '',
        口座種別: 'nisa_tsumitate',
      };

      const result = mapToHolding(row);

      expect(result.acquisition_price).toBeUndefined();
    });

    it('すべての口座種別をマッピングできる', () => {
      const accountTypes = ['specific', 'nisa_growth', 'nisa_tsumitate', 'nisa_legacy'] as const;

      for (const accountType of accountTypes) {
        const row: CsvRow = {
          銘柄コード: '7203',
          銘柄名: 'トヨタ',
          保有株数: '100',
          取得単価: '2500',
          口座種別: accountType,
        };

        const result = mapToHolding(row);
        expect(result.account_type).toBe(accountType);
      }
    });

    it('値の前後の空白をトリムしてマッピングする', () => {
      const row: CsvRow = {
        銘柄コード: ' 7203 ',
        銘柄名: ' トヨタ自動車 ',
        保有株数: ' 100 ',
        取得単価: ' 2500 ',
        口座種別: ' specific ',
      };

      const result = mapToHolding(row);

      expect(result).toEqual({
        stock_code: '7203',
        stock_name: 'トヨタ自動車',
        shares: 100,
        acquisition_price: 2500,
        account_type: 'specific',
      });
    });
  });
});
