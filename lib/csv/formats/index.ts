import type { CsvFormat, CsvMapper } from '../types';
import { GENERIC_HEADERS, mapToHolding } from './generic';
import { RAKUTEN_HEADERS, mapToHolding as rakutenMapToHolding } from './rakuten';
import { SBI_HEADERS, mapToHolding as sbiMapToHolding } from './sbi';

/**
 * フォーマット種別に対応するマッパー関数を取得
 * @param format - フォーマット種別
 * @returns マッパー関数
 */
export function getMapper(format: CsvFormat): CsvMapper {
  switch (format) {
    case 'generic':
      return mapToHolding;
    case 'sbi':
      return sbiMapToHolding;
    case 'rakuten':
      return rakutenMapToHolding;
  }
}

/**
 * フォーマット種別に対応する期待ヘッダーを取得
 * @param format - フォーマット種別
 * @returns 期待ヘッダー配列
 */
export function getExpectedHeaders(format: CsvFormat): readonly string[] {
  switch (format) {
    case 'generic':
      return GENERIC_HEADERS;
    case 'sbi':
      return SBI_HEADERS;
    case 'rakuten':
      return RAKUTEN_HEADERS;
  }
}
