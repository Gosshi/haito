import type { CsvFormat, CsvParseResult, CsvRow, CsvValidationError } from './types';
import { validateRow } from './validation';
import { getMapper } from './formats';
import { isSectionHeader, isSummaryRow, isDataHeader, extractAccountType } from './formats/sbi';
import type { AccountType } from '../holdings/types';

/**
 * UTF-8 BOMを除去する
 */
function removeBom(content: string): string {
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1);
  }
  return content;
}

/**
 * CSVフィールドをパースする（ダブルクォート対応）
 * カンマ区切りでフィールドを分割し、ダブルクォート内のカンマは無視する
 */
function parseFields(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // 次の文字もダブルクォートならエスケープ
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        // クォート終了
        inQuotes = false;
        i++;
        continue;
      }
      current += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (char === ',') {
        fields.push(current.trim());
        current = '';
        i++;
        continue;
      }
      current += char;
      i++;
    }
  }

  // 最後のフィールドを追加
  fields.push(current.trim());

  return fields;
}

/**
 * CSV文字列を論理行に分割する（ダブルクォート内の改行に対応）
 */
function splitLines(content: string): string[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        // 次の文字もダブルクォートならエスケープ
        if (i + 1 < content.length && content[i + 1] === '"') {
          current += '""';
          i += 2;
          continue;
        }
        // クォート終了
        inQuotes = false;
        current += char;
        i++;
        continue;
      }
      current += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        current += char;
        i++;
        continue;
      }
      if (char === '\n') {
        lines.push(current);
        current = '';
        i++;
        continue;
      }
      if (char === '\r') {
        // Windows改行の場合
        if (i + 1 < content.length && content[i + 1] === '\n') {
          i++;
        }
        lines.push(current);
        current = '';
        i++;
        continue;
      }
      current += char;
      i++;
    }
  }

  // 最後の行を追加
  if (current !== '') {
    lines.push(current);
  }

  return lines;
}

/**
 * CSV文字列をパースして保有銘柄データに変換する
 * @param content - CSV文字列
 * @param format - フォーマット種別
 * @returns パース結果（成功データとエラー情報）
 */
export function parseCsv(content: string, format: CsvFormat): CsvParseResult {
  // SBIフォーマットは特別なパース処理が必要
  if (format === 'sbi') {
    return parseSbiCsv(content);
  }

  return parseGenericCsv(content, format);
}

/**
 * 汎用CSVフォーマットをパースする
 */
function parseGenericCsv(content: string, format: CsvFormat): CsvParseResult {
  const holdings: CsvParseResult['holdings'] = [];
  const errors: CsvValidationError[] = [];

  // BOM除去
  const cleanContent = removeBom(content);

  // 行分割（ダブルクォート内改行対応）
  const lines = splitLines(cleanContent);

  // 空行をスキップしてフィルタリング
  const nonEmptyLines = lines.filter((line) => line.trim() !== '');

  if (nonEmptyLines.length === 0) {
    return { holdings, errors };
  }

  // ヘッダー行を取得
  const headerLine = nonEmptyLines[0];
  const headers = parseFields(headerLine);

  // マッパーを取得
  const mapper = getMapper(format);

  // データ行を処理
  for (let i = 1; i < nonEmptyLines.length; i++) {
    const line = nonEmptyLines[i];
    const values = parseFields(line);

    // 行をCsvRowに変換
    const row: CsvRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }

    // 行番号を計算（元のlines配列での位置 + 1）
    // nonEmptyLinesでのインデックスではなく、元の行番号を使用
    let originalLineNumber = 1; // ヘッダーは1
    let nonEmptyCount = 0;
    for (let k = 0; k < lines.length; k++) {
      if (lines[k].trim() !== '') {
        nonEmptyCount++;
        if (nonEmptyCount === i + 1) {
          originalLineNumber = k + 1;
          break;
        }
      }
    }

    // バリデーション
    const validationResult = validateRow(row, originalLineNumber);

    if (validationResult.ok === true) {
      // マッピング
      const holding = mapper(row);
      holdings.push(holding);
    } else {
      // エラーを追加
      errors.push(...validationResult.errors);
    }
  }

  return { holdings, errors };
}

/**
 * SBI証券CSVフォーマットをパースする
 * セクションヘッダー、集計行、タイトル行をスキップし、
 * 各セクションから口座種別を推論してデータ行をパースする
 */
function parseSbiCsv(content: string): CsvParseResult {
  const holdings: CsvParseResult['holdings'] = [];
  const errors: CsvValidationError[] = [];

  // BOM除去
  const cleanContent = removeBom(content);

  // 行分割
  const lines = splitLines(cleanContent);

  // マッパーを取得
  const mapper = getMapper('sbi');

  // 現在のセクションの口座種別
  let currentAccountType: AccountType = 'specific';

  // 現在のヘッダー行
  let currentHeaders: string[] = [];

  // 状態: ヘッダー行を探している状態
  let lookingForData = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
      continue;
    }

    const fields = parseFields(line);
    const firstCell = fields[0];

    // セクションヘッダー行を検出
    if (isSectionHeader(firstCell)) {
      // 新しいセクション開始、口座種別を更新
      currentAccountType = extractAccountType(firstCell);
      lookingForData = true;
      continue;
    }

    // 集計行をスキップ
    if (isSummaryRow(firstCell)) {
      continue;
    }

    // データヘッダー行を検出
    if (isDataHeader(firstCell)) {
      currentHeaders = fields;
      lookingForData = true;
      continue;
    }

    // データ行の処理（ヘッダー行が既に見つかっている場合）
    if (lookingForData && currentHeaders.length > 0) {
      // 銘柄コード形式かどうかをチェック（4桁の数字で始まる）
      if (/^\d{4}\s/.test(firstCell)) {
        // 行をCsvRowに変換
        const row: CsvRow = {};
        for (let j = 0; j < currentHeaders.length; j++) {
          row[currentHeaders[j]] = fields[j] ?? '';
        }

        // 口座種別を追加
        row['__account_type'] = currentAccountType;

        // マッピング
        try {
          const holding = mapper(row);
          holdings.push(holding);
        } catch {
          errors.push({
            lineNumber: i + 1,
            message: 'データの変換に失敗しました',
          });
        }
      }
    }
  }

  return { holdings, errors };
}
