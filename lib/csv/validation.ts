import type { AccountType } from '../holdings/types';
import type { CsvRow, CsvRowValidationResult, CsvValidationError } from './types';

const accountTypeValues: AccountType[] = [
  'specific',
  'nisa_growth',
  'nisa_tsumitate',
  'nisa_legacy',
];

/**
 * 銘柄コードが有効かチェック（4桁数字）
 */
export function isValidStockCode(value: string): boolean {
  const trimmed = value.trim();
  return /^\d{4}$/.test(trimmed);
}

/**
 * 保有株数が有効かチェック（正の整数）
 */
export function isValidShares(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return false;
  const num = Number(trimmed);
  return Number.isInteger(num) && num > 0;
}

/**
 * 取得単価が有効かチェック（正の数値、空は許容）
 */
export function isValidAcquisitionPrice(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return true;
  const num = Number(trimmed);
  return !Number.isNaN(num) && num > 0;
}

/**
 * 口座種別が有効かチェック（AccountType値）
 */
export function isValidAccountType(value: string): boolean {
  const trimmed = value.trim();
  return accountTypeValues.includes(trimmed as AccountType);
}

/**
 * CSV行データのバリデーションを実行
 * @param row - パース済み行データ
 * @param lineNumber - 行番号（1始まり）
 * @returns バリデーション結果
 */
export function validateRow(
  row: CsvRow,
  lineNumber: number
): CsvRowValidationResult {
  const errors: CsvValidationError[] = [];

  const stockCode = row['銘柄コード'] ?? '';
  const shares = row['保有株数'] ?? '';
  const acquisitionPrice = row['取得単価'] ?? '';
  const accountType = row['口座種別'] ?? '';

  // 銘柄コード: 4桁数字（必須）
  if (stockCode.trim() === '') {
    errors.push({
      lineNumber,
      message: '銘柄コードは必須です。',
    });
  } else if (!isValidStockCode(stockCode)) {
    errors.push({
      lineNumber,
      message: '銘柄コードは4桁の数字で入力してください。',
    });
  }

  // 保有株数: 正の整数（必須）
  if (shares.trim() === '') {
    errors.push({
      lineNumber,
      message: '保有株数は必須です。',
    });
  } else if (!isValidShares(shares)) {
    errors.push({
      lineNumber,
      message: '保有株数は正の整数で入力してください。',
    });
  }

  // 取得単価: 正の数値（任意）
  if (!isValidAcquisitionPrice(acquisitionPrice)) {
    errors.push({
      lineNumber,
      message: '取得単価は正の数値で入力してください。',
    });
  }

  // 口座種別: AccountType値（必須）
  if (accountType.trim() === '') {
    errors.push({
      lineNumber,
      message: '口座種別は必須です。',
    });
  } else if (!isValidAccountType(accountType)) {
    errors.push({
      lineNumber,
      message: '口座種別が不正です。',
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}
