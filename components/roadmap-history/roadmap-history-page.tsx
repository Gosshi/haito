'use client';

import { useEffect, useMemo, useState } from 'react';

import type { RoadmapHistoryDetail } from '../../lib/roadmap-history/types';
import { useRoadmapHistoryStore } from '../../stores/roadmap-history-store';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { RoadmapHistoryCompare } from './roadmap-history-compare';
import { RoadmapHistoryDetailView } from './roadmap-history-detail';
import { RoadmapHistoryList } from './roadmap-history-list';

const buildExportPayload = (detail: RoadmapHistoryDetail): string => {
  return JSON.stringify(
    {
      id: detail.id,
      created_at: detail.created_at,
      input: detail.input,
      summary: detail.summary,
      series: detail.series,
    },
    null,
    2
  );
};

const writeClipboard = async (text: string): Promise<boolean> => {
  if (!navigator?.clipboard?.writeText) {
    return false;
  }

  await navigator.clipboard.writeText(text);
  return true;
};

export function RoadmapHistoryPage() {
  const fetchHistoryList = useRoadmapHistoryStore(
    (state) => state.fetchHistoryList
  );
  const selectedDetail = useRoadmapHistoryStore(
    (state) => state.selectedDetail
  );

  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    void fetchHistoryList();
  }, [fetchHistoryList]);

  const exportPayload = useMemo(() => {
    if (!selectedDetail) {
      return null;
    }
    return buildExportPayload(selectedDetail);
  }, [selectedDetail]);

  const handleExport = async () => {
    if (!exportPayload) {
      return;
    }

    setExported(false);
    setExportError(null);

    try {
      const ok = await writeClipboard(exportPayload);
      if (!ok) {
        setExportError('クリップボードへの書き込みに失敗しました。');
        return;
      }
      setExported(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      setExportError(message);
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">ロードマップ履歴</h1>
        <p className="text-sm text-muted-foreground">
          過去に実行した配当ロードマップを確認できます。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <RoadmapHistoryList />
        <div className="space-y-6">
          <RoadmapHistoryDetailView />
          <Card>
            <CardContent className="space-y-3 py-6">
              <div>
                <h2 className="text-lg font-semibold">エクスポート/共有</h2>
                <p className="text-xs text-muted-foreground">
                  選択中の履歴をJSON形式でコピーできます。
                </p>
              </div>
              <Button
                type="button"
                onClick={handleExport}
                disabled={!exportPayload}
              >
                選択中の履歴をエクスポート
              </Button>
              {exported && (
                <p className="text-sm text-emerald-600">
                  クリップボードにコピーしました。
                </p>
              )}
              {exportError && (
                <p className="text-sm text-red-600">{exportError}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RoadmapHistoryCompare />
    </main>
  );
}
