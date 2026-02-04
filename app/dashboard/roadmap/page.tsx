'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { RoadmapChart } from '../../../components/roadmap/roadmap-chart';
import { RoadmapForm } from '../../../components/roadmap/roadmap-form';
import { RoadmapLevers } from '../../../components/roadmap/roadmap-levers';
import { RoadmapShockView } from '../../../components/roadmap/roadmap-shock-view';
import { RoadmapSummary } from '../../../components/roadmap/roadmap-summary';
import { ScenarioCompareView } from '../../../components/roadmap/scenario-compare-view';
import { Button } from '../../../components/ui/button';
import { useSettingsStore } from '../../../stores/settings-store';
import { useRoadmapStore } from '../../../stores/roadmap-store';
import { useScenarioCompareStore } from '../../../stores/scenario-compare-store';

export default function RoadmapPage() {
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  const error = useRoadmapStore((state) => state.error);
  const roadmapInput = useRoadmapStore((state) => state.input);
  const setInputFromRoadmap = useScenarioCompareStore(
    (state) => state.setInputFromRoadmap
  );
  const [viewMode, setViewMode] = useState<'single' | 'compare'>('single');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setInputFromRoadmap(roadmapInput);
  }, [roadmapInput, setInputFromRoadmap]);

  const errorMessage = error?.error?.message;
  const isUnauthorized = error?.error?.code === 'UNAUTHORIZED';

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">配当ロードマップ</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link className="text-primary hover:underline" href="/dashboard">
          ダッシュボードへ
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={viewMode === 'single' ? 'default' : 'outline'}
          onClick={() => setViewMode('single')}
          aria-pressed={viewMode === 'single'}
        >
          単一シナリオ
        </Button>
        <Button
          type="button"
          variant={viewMode === 'compare' ? 'default' : 'outline'}
          onClick={() => setViewMode('compare')}
          aria-pressed={viewMode === 'compare'}
        >
          シナリオ比較
        </Button>
      </div>

      {isUnauthorized && (
        <div className="rounded-md border border-dashed p-4 text-sm">
          <p className="font-medium">ログインが必要です。</p>
          {errorMessage && (
            <p className="mt-1 text-muted-foreground">{errorMessage}</p>
          )}
        </div>
      )}

      {!isUnauthorized && errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      {viewMode === 'single' ? (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">ロードマップの前提条件</h2>
            <RoadmapForm />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">ロードマップ概要</h2>
            <RoadmapSummary />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              配当の推移（ロードマップ）
            </h2>
            <RoadmapChart />
          </section>

          <section className="space-y-3">
            <RoadmapShockView />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              効きやすいレバー（感度チェック）
            </h2>
            <RoadmapLevers />
          </section>

          <p className="text-xs text-muted-foreground">
            入力した条件に基づく試算です。特定の投資商品を勧めるものではありません。
          </p>
        </>
      ) : (
        <ScenarioCompareView />
      )}
    </main>
  );
}
