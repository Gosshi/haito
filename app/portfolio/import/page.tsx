'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

import { DuplicateStrategySelect } from '../../../components/csv/duplicate-strategy-select';
import { FileUpload } from '../../../components/csv/file-upload';
import { ImportSummary } from '../../../components/csv/import-summary';
import { PreviewTable } from '../../../components/csv/preview-table';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Toaster } from '../../../components/ui/toaster';
import type { DuplicateStrategy, BulkImportResponse, DuplicateInfo } from '../../../lib/api/holdings-bulk';
import { checkDuplicates } from '../../../lib/api/holdings-bulk';
import { parseCsv } from '../../../lib/csv/parser';
import type { CsvParseResult } from '../../../lib/csv/types';
import type { Holding } from '../../../lib/holdings/types';
import { pushToast } from '../../../stores/toast-store';

interface BulkImportErrorResponse extends BulkImportResponse {
  error?: {
    type: string;
    message: string;
  };
}

export default function ImportPage() {
  const router = useRouter();
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip');
  const [isImporting, setIsImporting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);

  // Fetch existing holdings and check for duplicates when parseResult changes
  useEffect(() => {
    if (!parseResult || parseResult.holdings.length === 0) {
      setDuplicates([]);
      return;
    }

    const checkForDuplicates = async () => {
      try {
        const response = await fetch('/api/holdings');
        if (!response.ok) {
          // If fetching existing holdings fails, proceed with empty duplicates
          setDuplicates([]);
          return;
        }
        const existingHoldings: Holding[] = await response.json();
        const result = checkDuplicates(parseResult.holdings, existingHoldings);
        setDuplicates(result.duplicates);
      } catch {
        // On error, proceed without duplicate detection
        setDuplicates([]);
      }
    };

    checkForDuplicates();
  }, [parseResult]);

  const handleFileLoad = useCallback((content: string) => {
    setIsLoading(true);
    try {
      const result = parseCsv(content, 'generic');
      setParseResult(result);
    } catch {
      pushToast('ファイルの読み込みに失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!parseResult || parseResult.holdings.length === 0) {
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch('/api/holdings/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holdings: parseResult.holdings,
          duplicateStrategy,
        }),
      });

      const data: BulkImportErrorResponse = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.error?.message || 'Unknown error';
        pushToast(`インポートに失敗しました: ${errorMessage}`, 'error');
        return;
      }

      pushToast(
        `インポート完了: ${data.imported}件登録、${data.skipped}件スキップ`,
        'success'
      );
      router.push('/portfolio');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      pushToast(`インポートに失敗しました: ${errorMessage}`, 'error');
    } finally {
      setIsImporting(false);
    }
  }, [parseResult, duplicateStrategy, router]);

  const handleCancel = useCallback(() => {
    router.push('/portfolio');
  }, [router]);

  const totalRows = parseResult
    ? parseResult.holdings.length + parseResult.errors.length
    : 0;
  const validRows = parseResult?.holdings.length ?? 0;
  const errorRows = parseResult?.errors.length ?? 0;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">CSVインポート</h1>
        <p className="text-sm text-muted-foreground">
          CSVファイルから銘柄を一括でインポートします。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ファイルアップロード</CardTitle>
          <CardDescription>
            インポートするCSVファイルを選択してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload onFileLoad={handleFileLoad} isLoading={isLoading} />
        </CardContent>
      </Card>

      {parseResult && (
        <>
          <ImportSummary
            totalRows={totalRows}
            validRows={validRows}
            errorRows={errorRows}
          />

          <Card>
            <CardHeader>
              <CardTitle>プレビュー</CardTitle>
              <CardDescription>
                インポートされるデータを確認してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PreviewTable parseResult={parseResult} duplicates={duplicates} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>インポート設定</CardTitle>
              <CardDescription>
                重複データの処理方法を選択してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">重複時の処理:</span>
                <DuplicateStrategySelect
                  value={duplicateStrategy}
                  onChange={setDuplicateStrategy}
                  disabled={isImporting}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isImporting}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={validRows === 0 || isImporting}
            >
              {isImporting ? 'インポート中...' : 'インポート実行'}
            </Button>
          </div>
        </>
      )}

      {!parseResult && (
        <div className="flex justify-end">
          <Link
            href="/portfolio"
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            戻る
          </Link>
        </div>
      )}

      <Toaster />
    </main>
  );
}
