'use client';

import { useEffect, useState } from 'react';

import { getFeatureAccess } from '../../lib/access/feature-access';
import { useRoadmapShockStore } from '../../stores/roadmap-shock-store';
import { Card, CardContent } from '../ui/card';
import { RoadmapShockChart } from './roadmap-shock-chart';
import { RoadmapShockForm } from './roadmap-shock-form';
import { RoadmapShockSummary } from './roadmap-shock-summary';

type AccessState = 'loading' | 'allowed' | 'locked';

export function RoadmapShockView() {
  const [accessState, setAccessState] = useState<AccessState>('loading');
  const error = useRoadmapShockStore((state) => state.error);

  useEffect(() => {
    let isMounted = true;

    const loadAccess = async () => {
      try {
        const access = await getFeatureAccess();
        if (!isMounted) {
          return;
        }
        setAccessState(access.stress_test ? 'allowed' : 'locked');
      } catch {
        if (!isMounted) {
          return;
        }
        setAccessState('locked');
      }
    };

    void loadAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  const errorMessage = error?.error?.message ?? null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">想定外が起きた場合のロードマップ</h2>
        <p className="text-xs text-muted-foreground">
          一時的な減配が起きた場合の影響を確認できます。
        </p>
      </div>

      {accessState === 'loading' && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              利用状況を確認中です...
            </p>
          </CardContent>
        </Card>
      )}

      {accessState === 'locked' && (
        <Card>
          <CardContent className="space-y-2 py-6">
            <p className="text-sm font-medium">ストレステストは未実行です。</p>
            <p className="text-xs text-muted-foreground">
              有料プランで利用できます。
            </p>
          </CardContent>
        </Card>
      )}

      {accessState === 'allowed' && (
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
