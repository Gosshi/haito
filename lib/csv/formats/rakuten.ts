import type { AccountType, NewHolding } from '../../holdings/types';
import type { CsvMapper, CsvRow } from '../types';

/** 楽天証券CSVのヘッダー列名 */
export const RAKUTEN_HEADERS = [
  '銘柄',
  '口座',
  '保有数量',
  '平均取得価額',
  '現在値',
  '時価評価額',
  '評価損益',
  '評価損益率',
] as const;

/** 楽天証券の口座種別マッピング */
export const RAKUTEN_ACCOUNT_TYPE_MAP: Record<string, AccountType> = {
  '特定': 'specific',
  'NISA成長投資枠': 'nisa_growth',
  'NISAつみたて投資枠': 'nisa_tsumitate',
  'つみたてNISA': 'nisa_legacy',
};

/**
 * 行が楽天証券のヘッダー行かどうか判定
 * @param line - CSV行の文字列
 * @returns 楽天証券のヘッダー行ならtrue
 */
export function isRakutenHeader(line: string): boolean {
  if (!line) return false;

  // ダブルクォートを除去して判定
  const normalizedLine = line.replace(/"/g, '');

  // 「銘柄」を含み、「銘柄（コード）」や「銘柄コード」を含まない
  if (
    normalizedLine.includes('銘柄') &&
    !normalizedLine.includes('銘柄（コード）') &&
    !normalizedLine.includes('銘柄コード')
  ) {
    // 「口座」または「保有数量」も含む場合は楽天証券
    if (normalizedLine.includes('口座') || normalizedLine.includes('保有数量')) {
      return true;
    }
  }

  return false;
}

/**
 * 口座文字列からAccountType型を抽出
 * @param accountStr - 口座種別文字列
 * @returns 対応するAccountType
 */
export function extractAccountType(accountStr: string): AccountType {
  for (const [pattern, accountType] of Object.entries(RAKUTEN_ACCOUNT_TYPE_MAP)) {
    if (accountStr.includes(pattern)) {
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
 * 楽天証券CSV行をNewHoldingに変換
 * 既存のCsvMapper型に準拠
 */
export const mapToHolding: CsvMapper = (row: CsvRow): NewHolding => {
  const codeWithName = (row['銘柄'] ?? '').trim();
  const { code, name } = extractStockCode(codeWithName);

  const sharesStr = (row['保有数量'] ?? '').trim();
  const acquisitionPriceStr = (row['平均取得価額'] ?? '').trim();
  const accountStr = (row['口座'] ?? '').trim();

  // __account_typeが設定されている場合はそれを優先、なければ口座列から抽出
  const accountType = row['__account_type']
    ? (row['__account_type'] as AccountType)
    : extractAccountType(accountStr);

  const holding: NewHolding = {
    stock_code: code,
    shares: Number(sharesStr),
    account_type: accountType,
  };

  if (name !== '') {
    holding.stock_name = name;
  }

  // 取得単価が「----」の場合はnull、空の場合は設定しない
  if (acquisitionPriceStr !== '' && acquisitionPriceStr !== '----') {
    holding.acquisition_price = Number(acquisitionPriceStr);
  } else if (acquisitionPriceStr === '----') {
    holding.acquisition_price = null;
  }

  return holding;
};
