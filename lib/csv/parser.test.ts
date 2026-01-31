import { describe, it, expect } from 'vitest';
import { parseCsv } from './parser';

describe('parseCsv', () => {
  describe('基本機能', () => {
    it('正常なCSVをパースしてNewHolding配列を返す', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,トヨタ自動車,100,2500,specific`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0]).toEqual({
        stock_code: '7203',
        stock_name: 'トヨタ自動車',
        shares: 100,
        acquisition_price: 2500,
        account_type: 'specific',
      });
      expect(result.errors).toHaveLength(0);
    });

    it('複数行のCSVをパースする', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,トヨタ自動車,100,2500,specific
9984,ソフトバンク,50,8000,nisa_growth`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('BOM除去', () => {
    it('UTF-8 BOM付きCSVを正しくパースする', () => {
      const csv = `\uFEFF銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,トヨタ自動車,100,2500,specific`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].stock_code).toBe('7203');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('空行スキップ', () => {
    it('データ間の空行をスキップする', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,トヨタ自動車,100,2500,specific

9984,ソフトバンク,50,8000,nisa_growth`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('末尾の空行をスキップする', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,トヨタ自動車,100,2500,specific
`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('ダブルクォート処理', () => {
    it('ダブルクォートで囲まれた値内のカンマを正しく処理する', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,"トヨタ自動車,株式会社",100,2500,specific`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].stock_name).toBe('トヨタ自動車,株式会社');
    });

    it('ダブルクォート内の改行を正しく処理する', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,"トヨタ
自動車",100,2500,specific`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].stock_name).toBe('トヨタ\n自動車');
    });
  });

  describe('空白トリム', () => {
    it('値の前後の空白をトリムする', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
 7203 , トヨタ自動車 , 100 , 2500 , specific `;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].stock_code).toBe('7203');
      expect(result.holdings[0].stock_name).toBe('トヨタ自動車');
    });
  });

  describe('バリデーションエラー', () => {
    it('バリデーションエラーがある行をエラーとして記録する', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
AAAA,トヨタ自動車,100,2500,specific`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].lineNumber).toBe(2);
      expect(result.errors[0].message).toContain('銘柄コード');
    });

    it('成功行とエラー行を分離して処理する', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,トヨタ自動車,100,2500,specific
INVALID,エラー,-1,abc,unknown
9984,ソフトバンク,50,8000,nisa_growth`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(2);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].lineNumber).toBe(3);
    });
  });

  describe('行番号', () => {
    it('行番号はヘッダーを1として数える', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,トヨタ自動車,100,2500,specific
INVALID,エラー行,100,2500,specific`;

      const result = parseCsv(csv, 'generic');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].lineNumber).toBe(3);
    });
  });
});
