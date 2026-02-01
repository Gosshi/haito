/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreviewTable } from './preview-table';
import type { CsvParseResult } from '../../lib/csv/types';
import type { DuplicateInfo } from '../../lib/api/holdings-bulk';

describe('PreviewTable', () => {
  describe('5.1 重複情報の受け渡し', () => {
    it('duplicatesプロパティを受け取ることができる', () => {
      const parseResult: CsvParseResult = {
        holdings: [
          {
            stock_code: '7203',
            stock_name: 'トヨタ自動車',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      };

      const duplicates: DuplicateInfo[] = [];

      // propsとしてduplicatesを渡せることを確認
      const { container } = render(
        <PreviewTable parseResult={parseResult} duplicates={duplicates} />
      );

      expect(container).toBeInTheDocument();
    });

    it('duplicatesが未指定でも正常に動作する（後方互換性）', () => {
      const parseResult: CsvParseResult = {
        holdings: [
          {
            stock_code: '7203',
            stock_name: 'トヨタ自動車',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      };

      // duplicatesを指定しない場合も動作
      const { container } = render(
        <PreviewTable parseResult={parseResult} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('5.2 重複行の視覚的表示', () => {
    it('重複行の背景色が変更される', () => {
      const parseResult: CsvParseResult = {
        holdings: [
          {
            stock_code: '7203',
            stock_name: 'トヨタ自動車',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      };

      const duplicates: DuplicateInfo[] = [
        {
          rowNumber: 0,
          stockCode: '7203',
          accountType: 'specific',
          existingHoldingId: 'id-1',
        },
      ];

      render(
        <PreviewTable parseResult={parseResult} duplicates={duplicates} />
      );

      // 重複行が黄色背景を持つことを確認
      const rows = screen.getAllByRole('row');
      // ヘッダー行を除いた最初のデータ行
      const dataRow = rows[1];
      expect(dataRow).toHaveClass('bg-yellow-50');
    });

    it('非重複行は通常の背景色を持つ', () => {
      const parseResult: CsvParseResult = {
        holdings: [
          {
            stock_code: '7203',
            stock_name: 'トヨタ自動車',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      };

      const duplicates: DuplicateInfo[] = [];

      render(
        <PreviewTable parseResult={parseResult} duplicates={duplicates} />
      );

      // 非重複行は黄色背景を持たない
      const rows = screen.getAllByRole('row');
      const dataRow = rows[1];
      expect(dataRow).not.toHaveClass('bg-yellow-50');
    });

    it('重複理由がステータス列に表示される', () => {
      const parseResult: CsvParseResult = {
        holdings: [
          {
            stock_code: '7203',
            stock_name: 'トヨタ自動車',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      };

      const duplicates: DuplicateInfo[] = [
        {
          rowNumber: 0,
          stockCode: '7203',
          accountType: 'specific',
          existingHoldingId: 'id-1',
        },
      ];

      render(
        <PreviewTable parseResult={parseResult} duplicates={duplicates} />
      );

      // 重複理由が「重複」として表示されることを確認
      expect(screen.getByText('重複')).toBeInTheDocument();
    });

    it('非重複行はOKステータスを表示する', () => {
      const parseResult: CsvParseResult = {
        holdings: [
          {
            stock_code: '7203',
            stock_name: 'トヨタ自動車',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      };

      const duplicates: DuplicateInfo[] = [];

      render(
        <PreviewTable parseResult={parseResult} duplicates={duplicates} />
      );

      // OKステータスが表示される
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('重複件数のサマリーがテーブル上部に表示される', () => {
      const parseResult: CsvParseResult = {
        holdings: [
          {
            stock_code: '7203',
            stock_name: 'トヨタ自動車',
            shares: 100,
            account_type: 'specific',
          },
          {
            stock_code: '9984',
            stock_name: 'ソフトバンク',
            shares: 200,
            account_type: 'nisa_growth',
          },
        ],
        errors: [],
      };

      const duplicates: DuplicateInfo[] = [
        {
          rowNumber: 0,
          stockCode: '7203',
          accountType: 'specific',
          existingHoldingId: 'id-1',
        },
      ];

      render(
        <PreviewTable parseResult={parseResult} duplicates={duplicates} />
      );

      // 重複件数サマリーが表示される（1件の重複）
      expect(screen.getByText(/重複: 1件/)).toBeInTheDocument();
    });

    it('重複がない場合はサマリーに重複なしと表示される', () => {
      const parseResult: CsvParseResult = {
        holdings: [
          {
            stock_code: '7203',
            stock_name: 'トヨタ自動車',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      };

      const duplicates: DuplicateInfo[] = [];

      render(
        <PreviewTable parseResult={parseResult} duplicates={duplicates} />
      );

      // 重複なしまたは重複: 0件
      expect(screen.getByText(/重複: 0件/)).toBeInTheDocument();
    });

    it('複数の重複がある場合、すべての重複行が表示される', () => {
      const parseResult: CsvParseResult = {
        holdings: [
          {
            stock_code: '7203',
            stock_name: 'トヨタ自動車',
            shares: 100,
            account_type: 'specific',
          },
          {
            stock_code: '9984',
            stock_name: 'ソフトバンク',
            shares: 200,
            account_type: 'nisa_growth',
          },
          {
            stock_code: '8306',
            stock_name: '三菱UFJ',
            shares: 50,
            account_type: 'specific',
          },
        ],
        errors: [],
      };

      const duplicates: DuplicateInfo[] = [
        {
          rowNumber: 0,
          stockCode: '7203',
          accountType: 'specific',
          existingHoldingId: 'id-1',
        },
        {
          rowNumber: 2,
          stockCode: '8306',
          accountType: 'specific',
          existingHoldingId: 'id-2',
        },
      ];

      render(
        <PreviewTable parseResult={parseResult} duplicates={duplicates} />
      );

      // 2件の重複
      expect(screen.getByText(/重複: 2件/)).toBeInTheDocument();

      // 重複ステータスが2つ表示される
      const duplicateLabels = screen.getAllByText('重複');
      expect(duplicateLabels).toHaveLength(2);
    });
  });

  describe('エラー行との共存', () => {
    it('重複行とエラー行が混在しても正しく表示される', () => {
      const parseResult: CsvParseResult = {
        holdings: [
          {
            stock_code: '7203',
            stock_name: 'トヨタ自動車',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [
          {
            lineNumber: 3,
            message: 'バリデーションエラー',
          },
        ],
      };

      const duplicates: DuplicateInfo[] = [
        {
          rowNumber: 0,
          stockCode: '7203',
          accountType: 'specific',
          existingHoldingId: 'id-1',
        },
      ];

      render(
        <PreviewTable parseResult={parseResult} duplicates={duplicates} />
      );

      // 重複とエラーの両方が表示される
      expect(screen.getByText('重複')).toBeInTheDocument();
      expect(screen.getByText('エラー')).toBeInTheDocument();
    });
  });
});
