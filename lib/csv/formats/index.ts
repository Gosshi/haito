import type { CsvFormat, CsvMapper } from '../types';
import { GENERIC_HEADERS, mapToHolding } from './generic';
import { SBI_HEADERS, mapToHolding as sbiMapToHolding } from './sbi';

/**
 * フォーマット種別に対応するマッパー関数を取得
 * @param format - フォーマット種別
 * @returns マッパー関数
 * @throws Error - 未実装フォーマットの場合
 */
export function getMapper(format: CsvFormat): CsvMapper {
  switch (format) {
    case 'generic':
      return mapToHolding;
    case 'sbi':
      return sbiMapToHolding;
    case 'rakuten':
      throw new Error("フォーマット 'rakuten' は未実装です。");
  }
}

/**
 * フォーマット種別に対応する期待ヘッダーを取得
 * @param format - フォーマット種別
 * @returns 期待ヘッダー配列
 * @throws Error - 未実装フォーマットの場合
 */
export function getExpectedHeaders(format: CsvFormat): readonly string[] {
  switch (format) {
    case 'generic':
      return GENERIC_HEADERS;
    case 'sbi':
      return SBI_HEADERS;
    case 'rakuten':
      throw new Error("フォーマット 'rakuten' は未実装です。");
  }
}
