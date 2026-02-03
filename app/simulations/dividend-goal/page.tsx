'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { SimulationForm } from '../../../components/simulations/simulation-form';
import { SimulationResults } from '../../../components/simulations/simulation-results';
import { useSettingsStore } from '../../../stores/settings-store';
import { useSimulationStore } from '../../../stores/simulation-store';

export default function DividendGoalSimulationPage() {
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  const error = useSimulationStore((state) => state.error);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const errorMessage = error?.error?.message;
  const isUnauthorized = error?.error?.code === 'UNAUTHORIZED';

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">配当目標シミュレーション</h1>
        <p className="text-sm text-muted-foreground">
          シミュレーション条件を調整して配当目標の達成を確認できます。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link className="text-primary hover:underline" href="/dashboard">
          ダッシュボードへ
        </Link>
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

      <SimulationForm />
      <SimulationResults />
    </main>
  );
}
