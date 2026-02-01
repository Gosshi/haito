import { describe, expect, test } from 'vitest';
import { detectFormat, type DetectedFormat } from './detect-format';

describe('detectFormat', () => {
  describe('SBI証券フォーマット検出', () => {
    test('SBI証券のヘッダー「銘柄（コード）」を含む場合は sbi を返す', () => {
      const content = '銘柄（コード）,取得日,保有数,取得単価,現在値\n9104 商船三井,2024/01/01,100,3500,4000';
      expect(detectFormat(content)).toBe('sbi');
    });

    test('SBI証券CSVの完全なヘッダー行を検出する', () => {
      const content = `銘柄（コード）,取得日,保有数,取得単価,現在値,前日比,前日比（％）,損益,損益（％）,評価額
9104 商船三井,2024/01/01,100,3500,4000,+50,+1.27,+50000,+14.29,400000`;
      expect(detectFormat(content)).toBe('sbi');
    });

    test('SBI証券CSVのセクションヘッダーがある場合も検出する', () => {
      const content = `国内株式(特定/一般口座)
銘柄（コード）,取得日,保有数,取得単価,現在値,前日比,前日比（％）,損益,損益（％）,評価額
9104 商船三井,2024/01/01,100,3500,4000,+50,+1.27,+50000,+14.29,400000`;
      expect(detectFormat(content)).toBe('sbi');
    });
  });

  describe('汎用フォーマット検出', () => {
    test('汎用ヘッダー「銘柄コード」を含む場合は generic を返す', () => {
      const content = '銘柄コード,銘柄名,保有株数,取得単価,口座種別\n9104,商船三井,100,3500,specific';
      expect(detectFormat(content)).toBe('generic');
    });

    test('汎用フォーマットの完全なヘッダー行を検出する', () => {
      const content = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
9104,商船三井,100,3500,specific
8306,三菱UFJ,200,1200,nisa_growth`;
      expect(detectFormat(content)).toBe('generic');
    });
  });

  describe('unknown検出', () => {
    test('いずれのパターンにも一致しない場合は unknown を返す', () => {
      const content = 'code,name,quantity,price\n9104,商船三井,100,3500';
      expect(detectFormat(content)).toBe('unknown');
    });

    test('空文字列の場合は unknown を返す', () => {
      expect(detectFormat('')).toBe('unknown');
    });

    test('空行のみの場合は unknown を返す', () => {
      expect(detectFormat('\n\n\n')).toBe('unknown');
    });

    test('英語ヘッダーの場合は unknown を返す', () => {
      const content = 'stock_code,stock_name,shares,price\n9104,Mitsui OSK,100,3500';
      expect(detectFormat(content)).toBe('unknown');
    });
  });

  describe('エッジケース', () => {
    test('先頭に空行がある場合も正しく検出する', () => {
      const content = `
銘柄コード,銘柄名,保有株数,取得単価,口座種別
9104,商船三井,100,3500,specific`;
      expect(detectFormat(content)).toBe('generic');
    });

    test('SBIセクションヘッダー後に空行がある場合も検出する', () => {
      const content = `国内株式(特定/一般口座)

銘柄（コード）,取得日,保有数,取得単価,現在値,前日比,前日比（％）,損益,損益（％）,評価額
9104 商船三井,2024/01/01,100,3500,4000,+50,+1.27,+50000,+14.29,400000`;
      expect(detectFormat(content)).toBe('sbi');
    });

    test('CRLFの改行コードでも正しく検出する', () => {
      const content = '銘柄コード,銘柄名,保有株数,取得単価,口座種別\r\n9104,商船三井,100,3500,specific';
      expect(detectFormat(content)).toBe('generic');
    });
  });

  describe('型定義', () => {
    test('DetectedFormat型はすべての想定値を含む', () => {
      const formats: DetectedFormat[] = ['generic', 'sbi', 'rakuten', 'unknown'];
      expect(formats).toHaveLength(4);
    });
  });
});
