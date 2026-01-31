import type { NewHolding } from '../holdings/types';

/** パース済み行データ（ヘッダーをキーとした文字列マップ） */
export type CsvRow = Record<string, string>;

/** フォーマット種別 */
export type CsvFormat = 'generic' | 'sbi' | 'rakuten';

/** バリデーションエラー詳細 */
export type CsvValidationError = {
  /** 行番号（1始まり、ヘッダー行を含む） */
  lineNumber: number;
  /** エラーメッセージ */
  message: string;
};

/** パース結果 */
export type CsvParseResult = {
  /** 成功した保有銘柄データ */
  holdings: NewHolding[];
  /** エラー情報 */
  errors: CsvValidationError[];
};

/** マッパー関数の型 */
export type CsvMapper = (row: CsvRow) => NewHolding;

/** バリデーション結果 */
export type CsvRowValidationResult =
  | { ok: true }
  | { ok: false; errors: CsvValidationError[] };
