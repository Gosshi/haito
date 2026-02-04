'use client';

import { useEffect } from 'react';

import { useFeatureAccessStore } from '../../stores/feature-access-store';
import { useRoadmapShockStore } from '../../stores/roadmap-shock-store';
import { PremiumLockBanner } from '../premium/premium-lock-banner';
import { RoadmapShockChart } from './roadmap-shock-chart';
import { RoadmapShockForm } from './roadmap-shock-form';
import { RoadmapShockSummary } from './roadmap-shock-summary';

export function RoadmapShockView() {
  const error = useRoadmapShockStore((state) => state.error);
  const lockState = useFeatureAccessStore(
    (state) => state.locks.stress_test
  );
  const refreshStatus = useFeatureAccessStore((state) => state.refreshStatus);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const errorMessage =
    error?.error?.code === 'FORBIDDEN' ? null : error?.error?.message ?? null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">想定外が起きた場合のロードマップ</h2>
        <p className="text-xs text-muted-foreground">
          一時的な減配が起きた場合の影響を確認できます。
        </p>
      </div>

      {lockState.locked ? (
        <PremiumLockBanner feature="stress_test" />
      ) : (
        <>
          <section className="space-y-3">
            <h3 className="text-base font-semibold">ストレステスト入力</h3>
            <RoadmapShockForm />
            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold">差分サマリー</h3>
            <RoadmapShockSummary />
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold">配当の推移（比較）</h3>
            <RoadmapShockChart />
          </section>
        </>
      )}
    </div>
  );
}
