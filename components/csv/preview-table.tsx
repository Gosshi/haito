'use client';

import type { CsvParseResult } from '../../lib/csv/types';
import type { AccountType, NewHolding } from '../../lib/holdings/types';
import type { DuplicateInfo } from '../../lib/api/holdings-bulk';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

const accountTypeLabels: Record<AccountType, string> = {
  specific: '特定口座',
  nisa_growth: 'NISA成長投資枠',
  nisa_tsumitate: 'NISAつみたて投資枠',
  nisa_legacy: '旧NISA',
};

const formatAccountType = (value: AccountType): string =>
  accountTypeLabels[value] ?? value;

const formatShares = (value: number): string => value.toLocaleString();

const formatAcquisitionPrice = (value: number | null | undefined): string =>
  typeof value === 'number' ? value.toLocaleString() : '-';

export interface PreviewTableProps {
  parseResult: CsvParseResult;
  duplicates?: DuplicateInfo[];
}

type RowData = {
  rowNumber: number;
  holding: NewHolding | null;
  error: string | null;
  isDuplicate: boolean;
  holdingIndex: number;
};

export function PreviewTable({ parseResult, duplicates = [] }: PreviewTableProps) {
  const { holdings, errors } = parseResult;

  // Build a set of duplicate row indices for quick lookup
  const duplicateRowIndices = new Set(duplicates.map((d) => d.rowNumber));

  // Create a map of errors by line number
  const errorsByLine = new Map<number, string>();
  for (const error of errors) {
    const existing = errorsByLine.get(error.lineNumber);
    if (existing) {
      errorsByLine.set(error.lineNumber, `${existing}; ${error.message}`);
    } else {
      errorsByLine.set(error.lineNumber, error.message);
    }
  }

  // Build row data: combine holdings with their row numbers and errors
  // Since holdings don't have rowNumber, we need to track valid row indices
  const rows: RowData[] = [];

  // Get all line numbers from errors
  const errorLineNumbers = Array.from(errorsByLine.keys());

  // Build list of all rows
  // Holdings are in order, we assign row numbers starting from 2 (after header)
  // but we need to account for error rows interleaved
  let holdingIndex = 0;
  let rowNumber = 2; // Start from 2 (1 is header)

  // Collect all row numbers that have data
  const allRowNumbers = new Set<number>();

  // Add error row numbers
  for (const lineNum of errorLineNumbers) {
    allRowNumbers.add(lineNum);
  }

  // Calculate holding row numbers (excluding error rows)
  // We have holdings.length valid rows
  // Row numbers start at 2, skip rows that have errors
  const validRowNumbers: number[] = [];
  let currentRow = 2;
  while (validRowNumbers.length < holdings.length) {
    if (!errorsByLine.has(currentRow)) {
      validRowNumbers.push(currentRow);
    }
    currentRow++;
  }

  // Add valid row numbers
  for (const num of validRowNumbers) {
    allRowNumbers.add(num);
  }

  // Sort all row numbers
  const sortedRowNumbers = Array.from(allRowNumbers).sort((a, b) => a - b);

  // Build row data
  for (const rowNum of sortedRowNumbers) {
    if (errorsByLine.has(rowNum)) {
      rows.push({
        rowNumber: rowNum,
        holding: null,
        error: errorsByLine.get(rowNum) ?? null,
        isDuplicate: false,
        holdingIndex: -1,
      });
    } else {
      const idx = validRowNumbers.indexOf(rowNum);
      if (idx !== -1 && idx < holdings.length) {
        rows.push({
          rowNumber: rowNum,
          holding: holdings[idx],
          error: null,
          isDuplicate: duplicateRowIndices.has(idx),
          holdingIndex: idx,
        });
      }
    }
  }

  // Count duplicates for summary
  const duplicateCount = duplicates.length;

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        表示するデータがありません。
      </p>
    );
  }

  return (
    <div>
      <div className="mb-2 text-sm text-muted-foreground">
        重複: {duplicateCount}件
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">行番号</TableHead>
            <TableHead>銘柄コード</TableHead>
            <TableHead>銘柄名</TableHead>
            <TableHead className="text-right">保有株数</TableHead>
            <TableHead className="text-right">取得単価</TableHead>
            <TableHead>口座種別</TableHead>
            <TableHead className="w-24">ステータス</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const hasError = row.error !== null;
            const isDuplicate = row.isDuplicate;

            // Determine row background color
            let rowClassName = '';
            if (hasError) {
              rowClassName = 'bg-red-50';
            } else if (isDuplicate) {
              rowClassName = 'bg-yellow-50';
            }

            if (hasError) {
              return (
                <TableRow key={row.rowNumber} className={rowClassName}>
                  <TableCell>{row.rowNumber}</TableCell>
                  <TableCell colSpan={5} title={row.error ?? undefined}>
                    <span className="text-red-600">{row.error}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600">エラー</span>
                  </TableCell>
                </TableRow>
              );
            }

            const holding = row.holding;
            if (!holding) return null;

            return (
              <TableRow key={row.rowNumber} className={rowClassName}>
                <TableCell>{row.rowNumber}</TableCell>
                <TableCell className="font-medium">{holding.stock_code}</TableCell>
                <TableCell>{holding.stock_name ?? '-'}</TableCell>
                <TableCell className="text-right">
                  {formatShares(holding.shares)}
                </TableCell>
                <TableCell className="text-right">
                  {formatAcquisitionPrice(holding.acquisition_price)}
                </TableCell>
                <TableCell>{formatAccountType(holding.account_type)}</TableCell>
                <TableCell>
                  {isDuplicate ? (
                    <span className="text-yellow-600">重複</span>
                  ) : (
                    <span className="text-emerald-600">OK</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
