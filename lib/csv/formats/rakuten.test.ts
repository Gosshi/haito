import { describe, it, expect } from 'vitest';
import {
  RAKUTEN_HEADERS,
  RAKUTEN_ACCOUNT_TYPE_MAP,
  isRakutenHeader,
  extractAccountType,
  extractStockCode,
  mapToHolding,
} from './rakuten';
import type { CsvRow } from '../types';

describe('rakuten format', () => {
  describe('RAKUTEN_HEADERS', () => {
    it('楽天証券CSVのヘッダー列名を定義している', () => {
      expect(RAKUTEN_HEADERS).toContain('銘柄');
      expect(RAKUTEN_HEADERS).toContain('口座');
      expect(RAKUTEN_HEADERS).toContain('保有数量');
      expect(RAKUTEN_HEADERS).toContain('平均取得価額');
    });

    it('SBI証券とは異なるヘッダーを持つ', () => {
      expect(RAKUTEN_HEADERS).not.toContain('銘柄（コード）');
    });
  });

  describe('RAKUTEN_ACCOUNT_TYPE_MAP', () => {
    it('特定をspecificにマッピングする', () => {
      expect(RAKUTEN_ACCOUNT_TYPE_MAP['特定']).toBe('specific');
    });

    it('NISA成長投資枠をnisa_growthにマッピングする', () => {
      expect(RAKUTEN_ACCOUNT_TYPE_MAP['NISA成長投資枠']).toBe('nisa_growth');
    });

    it('NISAつみたて投資枠をnisa_tsumitateにマッピングする', () => {
      expect(RAKUTEN_ACCOUNT_TYPE_MAP['NISAつみたて投資枠']).toBe('nisa_tsumitate');
    });

    it('つみたてNISAをnisa_legacyにマッピングする', () => {
      expect(RAKUTEN_ACCOUNT_TYPE_MAP['つみたてNISA']).toBe('nisa_legacy');
    });
  });

  describe('isRakutenHeader', () => {
    it('楽天証券のヘッダー行を認識する', () => {
      expect(isRakutenHeader('銘柄,口座,保有数量')).toBe(true);
    });

    it('SBI証券のヘッダー行は認識しない', () => {
      expect(isRakutenHeader('銘柄（コード）,買付日,数量')).toBe(false);
    });

    it('汎用フォーマットのヘッダー行は認識しない', () => {
      expect(isRakutenHeader('銘柄コード,銘柄名,保有株数')).toBe(false);
    });

    it('空文字列はfalseを返す', () => {
      expect(isRakutenHeader('')).toBe(false);
    });

    it('ダブルクォートで囲まれたヘッダーも認識する', () => {
      expect(isRakutenHeader('"銘柄","口座","保有数量"')).toBe(true);
    });
  });

  describe('extractAccountType', () => {
    it('特定からspecificを抽出する', () => {
      expect(extractAccountType('特定')).toBe('specific');
    });

    it('NISA成長投資枠からnisa_growthを抽出する', () => {
      expect(extractAccountType('NISA成長投資枠')).toBe('nisa_growth');
    });

    it('NISAつみたて投資枠からnisa_tsumitateを抽出する', () => {
      expect(extractAccountType('NISAつみたて投資枠')).toBe('nisa_tsumitate');
    });

    it('つみたてNISAからnisa_legacyを抽出する', () => {
      expect(extractAccountType('つみたてNISA')).toBe('nisa_legacy');
    });

    it('マッチしない場合はspecificをデフォルトで返す', () => {
      expect(extractAccountType('不明な口座')).toBe('specific');
    });
  });

  describe('extractStockCode', () => {
    it('「9104 商船三井」から銘柄コード「9104」を抽出する', () => {
      const result = extractStockCode('9104 商船三井');
      expect(result.code).toBe('9104');
      expect(result.name).toBe('商船三井');
    });

    it('「1605 ＩＮＰＥＸ」から銘柄コード「1605」を抽出する', () => {
      const result = extractStockCode('1605 ＩＮＰＥＸ');
      expect(result.code).toBe('1605');
      expect(result.name).toBe('ＩＮＰＥＸ');
    });

    it('空白が複数ある場合も正しく処理する', () => {
      const result = extractStockCode('9104  商船三井');
      expect(result.code).toBe('9104');
      expect(result.name).toBe('商船三井');
    });

    it('コードのみの場合は名前が空になる', () => {
      const result = extractStockCode('9104');
      expect(result.code).toBe('9104');
      expect(result.name).toBe('');
    });

    it('マッチしない場合はそのまま返す', () => {
      const result = extractStockCode('投資信託名');
      expect(result.code).toBe('投資信託名');
      expect(result.name).toBe('');
    });
  });

  describe('mapToHolding', () => {
    it('楽天証券CSV行をNewHoldingに変換する', () => {
      const row: CsvRow = {
        '銘柄': '9104 商船三井',
        '口座': '特定',
        '保有数量': '100',
        '平均取得価額': '3200',
      };

      const result = mapToHolding(row);

      expect(result.stock_code).toBe('9104');
      expect(result.stock_name).toBe('商船三井');
      expect(result.shares).toBe(100);
      expect(result.acquisition_price).toBe(3200);
      expect(result.account_type).toBe('specific');
    });

    it('NISA成長投資枠の口座種別を正しく設定する', () => {
      const row: CsvRow = {
        '銘柄': '9104 商船三井',
        '口座': 'NISA成長投資枠',
        '保有数量': '100',
        '平均取得価額': '3200',
      };

      const result = mapToHolding(row);

      expect(result.account_type).toBe('nisa_growth');
    });

    it('取得単価が「----」の場合はnullを設定する', () => {
      const row: CsvRow = {
        '銘柄': '9104 商船三井',
        '口座': '特定',
        '保有数量': '100',
        '平均取得価額': '----',
      };

      const result = mapToHolding(row);

      expect(result.acquisition_price).toBeNull();
    });

    it('取得単価が空の場合はundefined（設定しない）', () => {
      const row: CsvRow = {
        '銘柄': '9104 商船三井',
        '口座': '特定',
        '保有数量': '100',
        '平均取得価額': '',
      };

      const result = mapToHolding(row);

      expect(result.acquisition_price).toBeUndefined();
    });

    it('数量の小数点を正しく処理する', () => {
      const row: CsvRow = {
        '銘柄': '9104 商船三井',
        '口座': '特定',
        '保有数量': '100.5',
        '平均取得価額': '3200',
      };

      const result = mapToHolding(row);

      expect(result.shares).toBe(100.5);
    });

    it('口座種別が不明な場合はspecificになる', () => {
      const row: CsvRow = {
        '銘柄': '9104 商船三井',
        '口座': '不明な口座',
        '保有数量': '100',
        '平均取得価額': '3200',
      };

      const result = mapToHolding(row);

      expect(result.account_type).toBe('specific');
    });

    it('__account_typeが設定されている場合はそれを優先する', () => {
      const row: CsvRow = {
        '銘柄': '9104 商船三井',
        '口座': '特定',
        '保有数量': '100',
        '平均取得価額': '3200',
        '__account_type': 'nisa_growth',
      };

      const result = mapToHolding(row);

      expect(result.account_type).toBe('nisa_growth');
    });
  });
});
