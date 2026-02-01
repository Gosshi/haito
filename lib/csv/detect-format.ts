import { GENERIC_HEADERS } from './formats/generic';
import { SBI_HEADERS, isSectionHeader, isDataHeader } from './formats/sbi';

/** 検出結果のフォーマット種別（unknownを含む） */
export type DetectedFormat = 'generic' | 'sbi' | 'rakuten' | 'unknown';

/**
 * CSVコンテンツからフォーマットを検出
 * @param content - UTF-8変換済みCSV文字列
 * @returns 検出されたフォーマット種別
 */
export function detectFormat(content: string): DetectedFormat {
  if (!content || content.trim() === '') {
    return 'unknown';
  }

  // 改行コードを統一してから行に分割
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedContent.split('\n');

  // 各行を探索してフォーマットを判定
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '') {
      continue;
    }

    // SBI証券のセクションヘッダー行を検出
    if (isSectionHeader(trimmedLine)) {
      // セクションヘッダーが見つかった場合、SBIフォーマットの可能性が高い
      // 後続の行でデータヘッダーを確認するためcontinue
      continue;
    }

    // SBI証券のデータヘッダー行を検出
    const firstCell = trimmedLine.split(',')[0].replace(/^"/, '').replace(/"$/, '');
    if (isDataHeader(firstCell)) {
      return 'sbi';
    }

    // SBI証券のヘッダーパターンをチェック
    if (trimmedLine.includes(SBI_HEADERS[0])) {
      return 'sbi';
    }

    // 汎用フォーマットのヘッダーパターンをチェック
    if (trimmedLine.includes(GENERIC_HEADERS[0])) {
      return 'generic';
    }

    // この行はフォーマット判定に使用できない（タイトル行など）ので次へ
    // 最大20行まで探索
  }

  return 'unknown';
}
