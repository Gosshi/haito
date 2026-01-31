'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

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
import { parseCsv } from '../../../lib/csv/parser';
import type { CsvParseResult } from '../../../lib/csv/types';
import { pushToast } from '../../../stores/toast-store';

export default function ImportPage() {
  const router = useRouter();
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleImport = useCallback(() => {
    pushToast('この機能は未実装です', 'info');
  }, []);

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
              <PreviewTable parseResult={parseResult} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={validRows === 0}
            >
              インポート実行
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
