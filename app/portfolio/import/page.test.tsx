/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ImportPage from './page';
import { parseCsv } from '../../../lib/csv/parser';
import { pushToast } from '../../../stores/toast-store';

// モック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('../../../lib/csv/parser', () => ({
  parseCsv: vi.fn(),
}));

vi.mock('../../../stores/toast-store', () => ({
  pushToast: vi.fn(),
  useToastStore: vi.fn(() => []),
}));

// FileUploadコンポーネントのモック
let mockOnFormatDetected: ((format: 'generic' | 'sbi' | 'rakuten' | 'unknown') => void) | undefined;
let mockOnFileLoad: ((content: string) => void) | undefined;
vi.mock('../../../components/csv/file-upload', () => ({
  FileUpload: ({ onFileLoad, onFormatDetected }: {
    onFileLoad: (content: string) => void;
    onFormatDetected?: (format: 'generic' | 'sbi' | 'rakuten' | 'unknown') => void;
  }) => {
    // コールバックを保存して後で呼び出せるようにする
    mockOnFormatDetected = onFormatDetected;
    mockOnFileLoad = onFileLoad;
    return (
      <div data-testid="file-upload">
        <button
          type="button"
          onClick={() => {
            if (onFormatDetected) onFormatDetected('generic');
            onFileLoad('銘柄コード,銘柄名,保有株数\n8306,三菱UFJ,100');
          }}
        >
          ファイルを選択
        </button>
      </div>
    );
  },
}));

// fetch モック
const mockFetch = vi.fn();
global.fetch = mockFetch;


describe('ImportPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue(mockRouter);
    mockFetch.mockReset();
  });

  // ファイルアップロードをシミュレートするヘルパー関数
  const uploadFile = async () => {
    const button = screen.getByRole('button', { name: 'ファイルを選択' });

    await act(async () => {
      fireEvent.click(button);
      // Reactの再レンダリングを待つ
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  };

  describe('4.1 状態管理の拡張', () => {
    it('重複戦略選択コンポーネントがparseResult表示時に組み込まれている', async () => {
      // CSVパース成功結果をモック
      (parseCsv as Mock).mockReturnValue({
        holdings: [
          {
            stock_code: '8306',
            stock_name: '三菱UFJ',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      });

      render(<ImportPage />);
      await uploadFile();

      // 重複戦略選択が表示されていることを確認
      await waitFor(() => {
        const strategySelect = screen.getByLabelText('重複時の処理方法');
        expect(strategySelect).toBeInTheDocument();
      });
    });

    it('重複戦略のデフォルト値がskipになっている', async () => {
      (parseCsv as Mock).mockReturnValue({
        holdings: [
          {
            stock_code: '8306',
            stock_name: '三菱UFJ',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      });

      render(<ImportPage />);
      await uploadFile();

      await waitFor(() => {
        const strategySelect = screen.getByLabelText('重複時の処理方法') as HTMLSelectElement;
        expect(strategySelect.value).toBe('skip');
      });
    });

    it('インポートボタンクリック時にローディング状態が表示される', async () => {
      (parseCsv as Mock).mockReturnValue({
        holdings: [
          {
            stock_code: '8306',
            stock_name: '三菱UFJ',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      });

      // APIを遅延させる
      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<ImportPage />);
      await uploadFile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'インポート実行' })).toBeInTheDocument();
      });

      const importButton = screen.getByRole('button', { name: 'インポート実行' });

      await act(async () => {
        fireEvent.click(importButton);
      });

      // ボタンが無効化されていることを確認
      expect(importButton).toBeDisabled();
    });
  });

  describe('4.2 API呼び出し処理の実装', () => {
    it('インポート実行ボタンクリック時にAPIを呼び出す', async () => {
      const holdings = [
        {
          stock_code: '8306',
          stock_name: '三菱UFJ',
          shares: 100,
          account_type: 'specific' as const,
        },
      ];

      (parseCsv as Mock).mockReturnValue({
        holdings,
        errors: [],
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            imported: 1,
            skipped: 0,
            errors: [],
          }),
      });

      render(<ImportPage />);
      await uploadFile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'インポート実行' })).toBeInTheDocument();
      });

      const importButton = screen.getByRole('button', { name: 'インポート実行' });

      await act(async () => {
        fireEvent.click(importButton);
      });

      // APIが呼び出されたことを確認
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/holdings/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            holdings,
            duplicateStrategy: 'skip',
          }),
        });
      });
    });

    it('選択した重複戦略がAPIリクエストに含まれる', async () => {
      const holdings = [
        {
          stock_code: '8306',
          stock_name: '三菱UFJ',
          shares: 100,
          account_type: 'specific' as const,
        },
      ];

      (parseCsv as Mock).mockReturnValue({
        holdings,
        errors: [],
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            imported: 1,
            skipped: 0,
            errors: [],
          }),
      });

      render(<ImportPage />);
      await uploadFile();

      await waitFor(() => {
        expect(screen.getByLabelText('重複時の処理方法')).toBeInTheDocument();
      });

      // 重複戦略を「上書き」に変更
      const strategySelect = screen.getByLabelText('重複時の処理方法');
      await act(async () => {
        fireEvent.change(strategySelect, { target: { value: 'overwrite' } });
      });

      const importButton = screen.getByRole('button', { name: 'インポート実行' });

      await act(async () => {
        fireEvent.click(importButton);
      });

      // 選択した戦略がリクエストに含まれていることを確認
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/holdings/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            holdings,
            duplicateStrategy: 'overwrite',
          }),
        });
      });
    });
  });

  describe('4.3 レスポンス処理の実装', () => {
    it('成功時にインポート件数・スキップ件数をトースト表示する', async () => {
      (parseCsv as Mock).mockReturnValue({
        holdings: [
          {
            stock_code: '8306',
            stock_name: '三菱UFJ',
            shares: 100,
            account_type: 'specific',
          },
          {
            stock_code: '7203',
            stock_name: 'トヨタ',
            shares: 50,
            account_type: 'specific',
          },
        ],
        errors: [],
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            imported: 1,
            skipped: 1,
            errors: [],
          }),
      });

      render(<ImportPage />);
      await uploadFile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'インポート実行' })).toBeInTheDocument();
      });

      const importButton = screen.getByRole('button', { name: 'インポート実行' });

      await act(async () => {
        fireEvent.click(importButton);
      });

      // 成功トーストが表示されることを確認
      await waitFor(() => {
        expect(pushToast).toHaveBeenCalledWith(
          'インポート完了: 1件登録、1件スキップ',
          'success'
        );
      });
    });

    it('成功時に/portfolioページへリダイレクトする', async () => {
      (parseCsv as Mock).mockReturnValue({
        holdings: [
          {
            stock_code: '8306',
            stock_name: '三菱UFJ',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            imported: 1,
            skipped: 0,
            errors: [],
          }),
      });

      render(<ImportPage />);
      await uploadFile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'インポート実行' })).toBeInTheDocument();
      });

      const importButton = screen.getByRole('button', { name: 'インポート実行' });

      await act(async () => {
        fireEvent.click(importButton);
      });

      // リダイレクトされることを確認
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/portfolio');
      });
    });

    it('エラー時にエラー件数をトースト表示する', async () => {
      (parseCsv as Mock).mockReturnValue({
        holdings: [
          {
            stock_code: '8306',
            stock_name: '三菱UFJ',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      });

      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            imported: 0,
            skipped: 0,
            errors: [],
            error: {
              type: 'database',
              message: 'Database error',
            },
          }),
      });

      render(<ImportPage />);
      await uploadFile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'インポート実行' })).toBeInTheDocument();
      });

      const importButton = screen.getByRole('button', { name: 'インポート実行' });

      await act(async () => {
        fireEvent.click(importButton);
      });

      // エラートーストが表示されることを確認
      await waitFor(() => {
        expect(pushToast).toHaveBeenCalledWith(
          'インポートに失敗しました: Database error',
          'error'
        );
      });
    });

    it('エラー時はリダイレクトしない', async () => {
      (parseCsv as Mock).mockReturnValue({
        holdings: [
          {
            stock_code: '8306',
            stock_name: '三菱UFJ',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      });

      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            imported: 0,
            skipped: 0,
            errors: [],
            error: {
              type: 'database',
              message: 'Database error',
            },
          }),
      });

      render(<ImportPage />);
      await uploadFile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'インポート実行' })).toBeInTheDocument();
      });

      const importButton = screen.getByRole('button', { name: 'インポート実行' });

      await act(async () => {
        fireEvent.click(importButton);
      });

      // リダイレクトされないことを確認
      await waitFor(() => {
        expect(pushToast).toHaveBeenCalled();
      });
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('ネットワークエラー時にエラートーストを表示する', async () => {
      (parseCsv as Mock).mockReturnValue({
        holdings: [
          {
            stock_code: '8306',
            stock_name: '三菱UFJ',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ImportPage />);
      await uploadFile();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'インポート実行' })).toBeInTheDocument();
      });

      const importButton = screen.getByRole('button', { name: 'インポート実行' });

      await act(async () => {
        fireEvent.click(importButton);
      });

      // エラートーストが表示されることを確認
      await waitFor(() => {
        expect(pushToast).toHaveBeenCalledWith(
          'インポートに失敗しました: Network error',
          'error'
        );
      });
    });
  });

  describe('5.3 フォーマットバッジをインポート画面に統合する', () => {
    it('ファイルアップロード後にフォーマットバッジが表示される', async () => {
      (parseCsv as Mock).mockReturnValue({
        holdings: [
          {
            stock_code: '8306',
            stock_name: '三菱UFJ',
            shares: 100,
            account_type: 'specific',
          },
        ],
        errors: [],
      });

      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/holdings') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, imported: 1, skipped: 0, errors: [] }),
        });
      });

      render(<ImportPage />);

      // ファイルをアップロード
      await uploadFile();

      // フォーマットバッジが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('汎用フォーマットを検出しました')).toBeInTheDocument();
      });
    });
  });

  describe('5.1 重複情報の受け渡し', () => {
    it('CSVパース後に既存データを取得してPreviewTableに重複情報を渡す', async () => {
      const holdings = [
        {
          stock_code: '8306',
          stock_name: '三菱UFJ',
          shares: 100,
          account_type: 'specific' as const,
        },
      ];

      (parseCsv as Mock).mockReturnValue({
        holdings,
        errors: [],
      });

      // 既存データ取得APIのモック（重複あり）
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/holdings') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  id: 'existing-1',
                  user_id: 'user-1',
                  stock_code: '8306',
                  stock_name: '三菱UFJ',
                  shares: 50,
                  account_type: 'specific',
                  created_at: '2026-01-01T00:00:00Z',
                  updated_at: '2026-01-01T00:00:00Z',
                },
              ]),
          });
        }
        // その他のfetchは成功を返す
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              imported: 0,
              skipped: 1,
              errors: [],
            }),
        });
      });

      render(<ImportPage />);
      await uploadFile();

      // 重複サマリーが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/重複: 1件/)).toBeInTheDocument();
      });
    });

    it('既存データがない場合は重複なしとして表示される', async () => {
      const holdings = [
        {
          stock_code: '8306',
          stock_name: '三菱UFJ',
          shares: 100,
          account_type: 'specific' as const,
        },
      ];

      (parseCsv as Mock).mockReturnValue({
        holdings,
        errors: [],
      });

      // 既存データ取得APIのモック（空の配列を返す）
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/holdings') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              imported: 1,
              skipped: 0,
              errors: [],
            }),
        });
      });

      render(<ImportPage />);
      await uploadFile();

      // 重複なしとして表示される
      await waitFor(() => {
        expect(screen.getByText(/重複: 0件/)).toBeInTheDocument();
      });
    });

    it('既存データ取得に失敗した場合でもCSVプレビューは表示される', async () => {
      const holdings = [
        {
          stock_code: '8306',
          stock_name: '三菱UFJ',
          shares: 100,
          account_type: 'specific' as const,
        },
      ];

      (parseCsv as Mock).mockReturnValue({
        holdings,
        errors: [],
      });

      // 既存データ取得APIが失敗
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/holdings') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Unauthorized' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              imported: 1,
              skipped: 0,
              errors: [],
            }),
        });
      });

      render(<ImportPage />);
      await uploadFile();

      // プレビューテーブルが表示される（重複情報は0件として表示）
      await waitFor(() => {
        expect(screen.getByText('8306')).toBeInTheDocument();
        expect(screen.getByText(/重複: 0件/)).toBeInTheDocument();
      });
    });
  });
});
