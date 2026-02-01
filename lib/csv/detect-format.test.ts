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

  describe('楽天証券フォーマット検出', () => {
    test('楽天証券のヘッダー「銘柄」を含み「銘柄（コード）」を含まない場合は rakuten を返す', () => {
      const content = '銘柄,口座,保有数量,平均取得価額,現在値\n9104 商船三井,特定,100,3500,4000';
      expect(detectFormat(content)).toBe('rakuten');
    });

    test('楽天証券CSVの完全なヘッダー行を検出する', () => {
      const content = `銘柄,口座,保有数量,平均取得価額,現在値,時価評価額,評価損益,評価損益率
9104 商船三井,特定,100,3200,4839,483900,163900,51.22`;
      expect(detectFormat(content)).toBe('rakuten');
    });

    test('ダブルクォートで囲まれた楽天証券ヘッダーを検出する', () => {
      const content = `"銘柄","口座","保有数量","平均取得価額"
"9104 商船三井","特定","100","3200"`;
      expect(detectFormat(content)).toBe('rakuten');
    });

    test('先頭に空行がある場合も楽天証券を検出する', () => {
      const content = `
銘柄,口座,保有数量,平均取得価額
9104 商船三井,特定,100,3200`;
      expect(detectFormat(content)).toBe('rakuten');
    });

    test('CRLFの改行コードでも楽天証券を検出する', () => {
      const content = '銘柄,口座,保有数量,平均取得価額\r\n9104 商船三井,特定,100,3200';
      expect(detectFormat(content)).toBe('rakuten');
    });

    test('SBI証券と楽天証券が混在しない（SBI優先）', () => {
      // SBIのヘッダーがある場合はSBIとして検出
      const content = '銘柄（コード）,買付日,数量,取得単価\n9104 商船三井,2024/01/01,100,3500';
      expect(detectFormat(content)).toBe('sbi');
    });
  });

  describe('型定義', () => {
    test('DetectedFormat型はすべての想定値を含む', () => {
      const formats: DetectedFormat[] = ['generic', 'sbi', 'rakuten', 'unknown'];
      expect(formats).toHaveLength(4);
    });
  });
});
