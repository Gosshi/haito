import { describe, it, expect } from 'vitest';
import {
  SBI_HEADERS,
  SBI_ACCOUNT_TYPE_MAP,
  isSectionHeader,
  isSummaryRow,
  isDataHeader,
  extractAccountType,
  extractStockCode,
  mapToHolding,
} from './sbi';
import type { CsvRow } from '../types';

describe('sbi format', () => {
  describe('SBI_HEADERS', () => {
    it('SBI証券CSVのヘッダー列名を定義している', () => {
      expect(SBI_HEADERS).toContain('銘柄（コード）');
      expect(SBI_HEADERS).toContain('取得日');
      expect(SBI_HEADERS).toContain('保有数');
      expect(SBI_HEADERS).toContain('取得単価');
    });
  });

  describe('SBI_ACCOUNT_TYPE_MAP', () => {
    it('特定/一般口座をspecificにマッピングする', () => {
      expect(SBI_ACCOUNT_TYPE_MAP['特定/一般口座']).toBe('specific');
    });

    it('NISA口座(成長投資枠)をnisa_growthにマッピングする', () => {
      expect(SBI_ACCOUNT_TYPE_MAP['NISA口座(成長投資枠)']).toBe('nisa_growth');
    });

    it('NISA口座(つみたて投資枠)をnisa_tsumitateにマッピングする', () => {
      expect(SBI_ACCOUNT_TYPE_MAP['NISA口座(つみたて投資枠)']).toBe('nisa_tsumitate');
    });

    it('つみたてNISA口座をnisa_legacyにマッピングする', () => {
      expect(SBI_ACCOUNT_TYPE_MAP['つみたてNISA口座']).toBe('nisa_legacy');
    });
  });

  describe('isSectionHeader', () => {
    it('国内株式(特定/一般口座)をセクションヘッダーとして認識する', () => {
      expect(isSectionHeader('国内株式(特定/一般口座)')).toBe(true);
    });

    it('国内株式(NISA口座(成長投資枠))をセクションヘッダーとして認識する', () => {
      expect(isSectionHeader('国内株式(NISA口座(成長投資枠))')).toBe(true);
    });

    it('投資信託(数量/特定口座)をセクションヘッダーとして認識する', () => {
      expect(isSectionHeader('投資信託(数量/特定口座)')).toBe(true);
    });

    it('投資信託(数量/NISA口座(成長投資枠))をセクションヘッダーとして認識する', () => {
      expect(isSectionHeader('投資信託(数量/NISA口座(成長投資枠))')).toBe(true);
    });

    it('投資信託(数量/NISA口座(つみたて投資枠))をセクションヘッダーとして認識する', () => {
      expect(isSectionHeader('投資信託(数量/NISA口座(つみたて投資枠))')).toBe(true);
    });

    it('投資信託(数量/つみたてNISA口座)をセクションヘッダーとして認識する', () => {
      expect(isSectionHeader('投資信託(数量/つみたてNISA口座)')).toBe(true);
    });

    it('通常のデータ行はセクションヘッダーとして認識しない', () => {
      expect(isSectionHeader('9104 商船三井')).toBe(false);
    });

    it('空文字列はセクションヘッダーとして認識しない', () => {
      expect(isSectionHeader('')).toBe(false);
    });
  });

  describe('isSummaryRow', () => {
    it('国内株式(特定/一般口座)合計を集計行として認識する', () => {
      expect(isSummaryRow('国内株式(特定/一般口座)合計')).toBe(true);
    });

    it('投資信託(数量/NISA口座(成長投資枠))合計を集計行として認識する', () => {
      expect(isSummaryRow('投資信託(数量/NISA口座(成長投資枠))合計')).toBe(true);
    });

    it('総合計を集計行として認識する', () => {
      expect(isSummaryRow('総合計')).toBe(true);
    });

    it('通常のデータ行は集計行として認識しない', () => {
      expect(isSummaryRow('9104 商船三井')).toBe(false);
    });
  });

  describe('isDataHeader', () => {
    it('銘柄（コード）で始まる行をデータヘッダーとして認識する', () => {
      expect(isDataHeader('銘柄（コード）')).toBe(true);
    });

    it('ファンド名で始まる行をデータヘッダーとして認識する', () => {
      expect(isDataHeader('ファンド名')).toBe(true);
    });

    it('評価額で始まる行はデータヘッダーとして認識しない（集計ヘッダー）', () => {
      expect(isDataHeader('評価額')).toBe(false);
    });

    it('通常のデータ行はデータヘッダーとして認識しない', () => {
      expect(isDataHeader('9104 商船三井')).toBe(false);
    });
  });

  describe('extractAccountType', () => {
    it('国内株式(特定/一般口座)からspecificを抽出する', () => {
      expect(extractAccountType('国内株式(特定/一般口座)')).toBe('specific');
    });

    it('国内株式(NISA口座(成長投資枠))からnisa_growthを抽出する', () => {
      expect(extractAccountType('国内株式(NISA口座(成長投資枠))')).toBe('nisa_growth');
    });

    it('投資信託(数量/NISA口座(つみたて投資枠))からnisa_tsumitateを抽出する', () => {
      expect(extractAccountType('投資信託(数量/NISA口座(つみたて投資枠))')).toBe('nisa_tsumitate');
    });

    it('投資信託(数量/つみたてNISA口座)からnisa_legacyを抽出する', () => {
      expect(extractAccountType('投資信託(数量/つみたてNISA口座)')).toBe('nisa_legacy');
    });

    it('マッチしない場合はspecificをデフォルトで返す', () => {
      expect(extractAccountType('不明なセクション')).toBe('specific');
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

    it('「7203 トヨタ自動車」から銘柄コード「7203」を抽出する', () => {
      const result = extractStockCode('7203 トヨタ自動車');
      expect(result.code).toBe('7203');
      expect(result.name).toBe('トヨタ自動車');
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
  });

  describe('mapToHolding', () => {
    it('SBI証券CSV行をNewHoldingに変換する', () => {
      const row: CsvRow = {
        '銘柄（コード）': '9104 商船三井',
        '取得日': '2023/01/16',
        '保有数': '100',
        '取得単価': '3200',
        '現在値': '4839',
        '前日比': '-5',
        '前日比（％）': '-0.10',
        '損益': '+3278',
        '損益（％）': '+51.22',
        '評価額': '9678',
      };

      const result = mapToHolding(row);

      expect(result.stock_code).toBe('9104');
      expect(result.stock_name).toBe('商船三井');
      expect(result.shares).toBe(100);
      expect(result.acquisition_price).toBe(3200);
    });

    it('口座種別を正しく設定する', () => {
      const row: CsvRow = {
        '銘柄（コード）': '9104 商船三井',
        '取得日': '2023/01/16',
        '保有数': '100',
        '取得単価': '3200',
        '__account_type': 'nisa_growth',
      };

      const result = mapToHolding(row);

      expect(result.account_type).toBe('nisa_growth');
    });

    it('取得単価が「----」の場合はnullを設定する', () => {
      const row: CsvRow = {
        '銘柄（コード）': '9104 商船三井',
        '取得日': '----/--/--',
        '保有数': '100',
        '取得単価': '----',
      };

      const result = mapToHolding(row);

      expect(result.acquisition_price).toBeNull();
    });

    it('保有数の小数点を正しく処理する', () => {
      const row: CsvRow = {
        '銘柄（コード）': '9104 商船三井',
        '保有数': '100.5',
        '取得単価': '3200',
      };

      const result = mapToHolding(row);

      expect(result.shares).toBe(100.5);
    });

    it('デフォルトの口座種別はspecificになる', () => {
      const row: CsvRow = {
        '銘柄（コード）': '9104 商船三井',
        '保有数': '100',
        '取得単価': '3200',
      };

      const result = mapToHolding(row);

      expect(result.account_type).toBe('specific');
    });
  });
});
