import { describe, it, expect } from 'vitest';
import { parseCsv } from './parser';

describe('parseCsv edge cases', () => {
  describe('0件のデータ行（ヘッダーのみ）', () => {
    it('空の成功配列と空のエラー配列を返す', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('ヘッダー行のみでも改行ありの場合', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toEqual([]);
      expect(result.errors).toEqual([]);
    });
  });

  describe('1件のデータ行', () => {
    it('正常にパース結果を返す', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,トヨタ自動車,100,2500,specific`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].stock_code).toBe('7203');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('100件のデータ行', () => {
    it('正常にパース結果を返す', () => {
      const header = '銘柄コード,銘柄名,保有株数,取得単価,口座種別';
      const rows: string[] = [];
      for (let i = 0; i < 100; i++) {
        const code = String(1000 + i).padStart(4, '0');
        rows.push(`${code},銘柄${i},${i + 1},${(i + 1) * 100},specific`);
      }
      const csv = [header, ...rows].join('\n');

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(100);
      expect(result.errors).toHaveLength(0);

      // 最初と最後のデータを確認
      expect(result.holdings[0].stock_code).toBe('1000');
      expect(result.holdings[99].stock_code).toBe('1099');
    });
  });

  describe('成功行とエラー行の混在', () => {
    it('正しく分離して処理する', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,トヨタ自動車,100,2500,specific
INVALID,エラー行1,100,2500,specific
9984,ソフトバンク,50,8000,nisa_growth
,エラー行2,-1,abc,unknown
6758,ソニー,200,12000,nisa_legacy`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(3);
      expect(result.holdings[0].stock_code).toBe('7203');
      expect(result.holdings[1].stock_code).toBe('9984');
      expect(result.holdings[2].stock_code).toBe('6758');

      expect(result.errors.length).toBeGreaterThan(0);
      // 行3と行5にエラー
      const errorLines = result.errors.map((e) => e.lineNumber);
      expect(errorLines).toContain(3);
      expect(errorLines).toContain(5);
    });
  });

  describe('空文字列', () => {
    it('空のCSVは空の結果を返す', () => {
      const result = parseCsv('', 'generic');

      expect(result.holdings).toEqual([]);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Windows改行（CRLF）', () => {
    it('CRLFを正しく処理する', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別\r\n7203,トヨタ自動車,100,2500,specific\r\n9984,ソフトバンク,50,8000,nisa_growth`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('任意項目の空文字処理', () => {
    it('銘柄名と取得単価が空の場合', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,,100,,specific`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].stock_name).toBeUndefined();
      expect(result.holdings[0].acquisition_price).toBeUndefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('エスケープされたダブルクォート', () => {
    it('ダブルクォート内のダブルクォートを正しく処理する', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,"トヨタ""自動車""",100,2500,specific`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].stock_name).toBe('トヨタ"自動車"');
    });
  });

  describe('数値フィールドの処理', () => {
    it('整数の保有株数を正しく変換する', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,トヨタ,1000000,2500,specific`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings[0].shares).toBe(1000000);
    });

    it('小数の取得単価を正しく変換する', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7203,トヨタ,100,2500.75,specific`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings[0].acquisition_price).toBe(2500.75);
    });
  });

  describe('全口座種別', () => {
    it('すべての口座種別を正しく処理する', () => {
      const csv = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
7201,日産,100,1000,specific
7202,いすゞ,100,2000,nisa_growth
7203,トヨタ,100,3000,nisa_tsumitate
7204,ホンダ,100,4000,nisa_legacy`;

      const result = parseCsv(csv, 'generic');

      expect(result.holdings).toHaveLength(4);
      expect(result.holdings[0].account_type).toBe('specific');
      expect(result.holdings[1].account_type).toBe('nisa_growth');
      expect(result.holdings[2].account_type).toBe('nisa_tsumitate');
      expect(result.holdings[3].account_type).toBe('nisa_legacy');
    });
  });
});
