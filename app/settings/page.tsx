'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { GoalForm } from '../../components/settings/goal-form';
import { Toaster } from '../../components/ui/toaster';
import { useSettingsStore } from '../../stores/settings-store';

export default function SettingsPage() {
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">設定</h1>
        <p className="text-sm text-muted-foreground">
          年間配当目標を設定できます。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link className="text-primary hover:underline" href="/dashboard">
          ダッシュボードへ
        </Link>
      </div>
      <GoalForm />
      <Toaster />
    </main>
  );
}
