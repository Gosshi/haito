import type { AccountType, NewHolding } from '../../holdings/types';
import type { CsvMapper, CsvRow } from '../types';

/** SBI証券CSVのヘッダー列名 */
export const SBI_HEADERS = [
  '銘柄（コード）',
  '取得日',
  '保有数',
  '取得単価',
  '現在値',
  '前日比',
  '前日比（％）',
  '損益',
  '損益（％）',
  '評価額',
] as const;

/** SBI証券の口座種別マッピング */
export const SBI_ACCOUNT_TYPE_MAP: Record<string, AccountType> = {
  '特定/一般口座': 'specific',
  'NISA口座(成長投資枠)': 'nisa_growth',
  'NISA口座(つみたて投資枠)': 'nisa_tsumitate',
  'つみたてNISA口座': 'nisa_legacy',
};

/**
 * 行がセクションヘッダーかどうか判定
 * @param firstCell - 行の最初のセル
 * @returns セクションヘッダーならtrue
 */
export function isSectionHeader(firstCell: string): boolean {
  if (!firstCell) return false;

  // 国内株式(特定/一般口座) 形式
  if (firstCell.startsWith('国内株式(')) return true;

  // 投資信託(数量/...) 形式
  if (firstCell.startsWith('投資信託(')) return true;

  return false;
}

/**
 * 行が集計行かどうか判定
 * @param firstCell - 行の最初のセル
 * @returns 集計行ならtrue
 */
export function isSummaryRow(firstCell: string): boolean {
  if (!firstCell) return false;

  // "〜合計" で終わる行
  if (firstCell.endsWith('合計')) return true;

  // "総合計" 行
  if (firstCell === '総合計') return true;

  return false;
}

/**
 * 行がデータヘッダー行かどうか判定
 * @param firstCell - 行の最初のセル
 * @returns データヘッダー行ならtrue
 */
export function isDataHeader(firstCell: string): boolean {
  if (!firstCell) return false;

  // 銘柄（コード）で始まる行（国内株式のヘッダー）
  if (firstCell === '銘柄（コード）') return true;

  // ファンド名で始まる行（投資信託のヘッダー）
  if (firstCell === 'ファンド名') return true;

  return false;
}

/**
 * セクションヘッダーから口座種別を抽出
 * @param sectionHeader - セクションヘッダー文字列
 * @returns 対応するAccountType
 */
export function extractAccountType(sectionHeader: string): AccountType {
  // 口座種別パターンを検索
  for (const [pattern, accountType] of Object.entries(SBI_ACCOUNT_TYPE_MAP)) {
    if (sectionHeader.includes(pattern)) {
      return accountType;
    }
  }

  // デフォルトはspecific
  return 'specific';
}

/**
 * 「9104 商船三井」形式から銘柄コードと銘柄名を抽出
 * @param codeWithName - コード+銘柄名の文字列
 * @returns 銘柄コードと銘柄名のオブジェクト
 */
export function extractStockCode(codeWithName: string): { code: string; name: string } {
  const match = codeWithName.match(/^(\d{4})\s*(.*)$/);
  if (match) {
    return {
      code: match[1],
      name: match[2].trim(),
    };
  }

  // マッチしない場合はそのまま返す
  return {
    code: codeWithName,
    name: '',
  };
}

/**
 * SBI証券CSV行をNewHoldingに変換
 * 既存のCsvMapper型に準拠
 */
export const mapToHolding: CsvMapper = (row: CsvRow): NewHolding => {
  const codeWithName = (row['銘柄（コード）'] ?? '').trim();
  const { code, name } = extractStockCode(codeWithName);

  const sharesStr = (row['保有数'] ?? '').trim();
  const acquisitionPriceStr = (row['取得単価'] ?? '').trim();
  const accountType = (row['__account_type'] as AccountType) ?? 'specific';

  const holding: NewHolding = {
    stock_code: code,
    shares: Number(sharesStr),
    account_type: accountType,
  };

  if (name !== '') {
    holding.stock_name = name;
  }

  // 取得単価が「----」の場合はnull
  if (acquisitionPriceStr !== '' && acquisitionPriceStr !== '----') {
    holding.acquisition_price = Number(acquisitionPriceStr);
  } else if (acquisitionPriceStr === '----') {
    holding.acquisition_price = null;
  }

  return holding;
};
