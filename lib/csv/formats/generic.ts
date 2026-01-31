import type { AccountType, NewHolding } from '../../holdings/types';
import type { CsvMapper, CsvRow } from '../types';

/** 汎用フォーマットの期待ヘッダー */
export const GENERIC_HEADERS = [
  '銘柄コード',
  '銘柄名',
  '保有株数',
  '取得単価',
  '口座種別',
] as const;

/**
 * 汎用フォーマットのCsvRowをNewHoldingに変換
 */
export const mapToHolding: CsvMapper = (row: CsvRow): NewHolding => {
  const stockCode = (row['銘柄コード'] ?? '').trim();
  const stockName = (row['銘柄名'] ?? '').trim();
  const shares = (row['保有株数'] ?? '').trim();
  const acquisitionPrice = (row['取得単価'] ?? '').trim();
  const accountType = (row['口座種別'] ?? '').trim() as AccountType;

  const holding: NewHolding = {
    stock_code: stockCode,
    shares: Number(shares),
    account_type: accountType,
  };

  if (stockName !== '') {
    holding.stock_name = stockName;
  }

  if (acquisitionPrice !== '') {
    holding.acquisition_price = Number(acquisitionPrice);
  }

  return holding;
};
