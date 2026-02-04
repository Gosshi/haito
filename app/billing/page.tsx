'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import type { PlanTier } from '../../lib/access/feature-catalog';
import type {
  BillingCheckoutResponse,
  BillingPlan,
  BillingPlansResponse,
} from '../../lib/billing/types';

const fetchBillingPlans = async (): Promise<BillingPlansResponse> => {
  const response = await fetch('/api/billing/plans', { method: 'GET' });

  if (!response.ok) {
    throw new Error('Failed to fetch billing plans');
  }

  return (await response.json()) as BillingPlansResponse;
};

const requestCheckout = async (
  planId: PlanTier
): Promise<Response> => {
  return fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId }),
  });
};

export default function BillingPage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PlanTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      try {
        const data = await fetchBillingPlans();
        if (!isMounted) return;
        setPlans(data.plans);
        setCurrentPlan(data.current_plan);
        setError(null);
      } catch {
        if (!isMounted) return;
        setError('プラン情報の取得に失敗しました。');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentPlanName = useMemo(() => {
    if (!currentPlan) {
      return null;
    }
    const plan = plans.find((entry) => entry.id === currentPlan);
    return plan?.name ?? null;
  }, [plans, currentPlan]);

  const handleCheckout = async (planId: PlanTier) => {
    setCheckoutError(null);
    setNeedsLogin(false);
    setIsCheckingOut(true);

    try {
      const response = await requestCheckout(planId);

      if (response.status === 401) {
        setNeedsLogin(true);
        return;
      }

      if (!response.ok) {
        setCheckoutError('決済の開始に失敗しました。再試行してください。');
        return;
      }

      const payload = (await response.json()) as BillingCheckoutResponse;
      window.location.assign(payload.checkout_url);
    } catch {
      setCheckoutError('決済の開始に失敗しました。再試行してください。');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">料金プラン</h1>
        <p className="text-sm text-muted-foreground">
          無料/有料の違いを確認し、必要に応じてアップグレードできます。
        </p>
      </div>

      {currentPlanName && (
        <div className="text-sm text-muted-foreground">
          現在のプラン: <span className="font-semibold">{currentPlanName}</span>
        </div>
      )}

      {needsLogin && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>決済を開始するにはログインが必要です。</p>
          <Link href="/login" className="font-semibold underline">
            ログインする
          </Link>
        </div>
      )}

      {checkoutError && (
        <p className="text-sm text-red-600">{checkoutError}</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <Card key={plan.id} className={plan.premium ? 'border-amber-200' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <span
                      className={
                        plan.premium
                          ? 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700'
                          : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600'
                      }
                    >
                      {plan.premium ? '有料' : '無料'}
                    </span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{plan.price}</p>
                  {isCurrent && (
                    <p className="text-xs text-muted-foreground">現在のプラン</p>
                  )}
                </CardContent>
                <CardFooter>
                  {plan.premium ? (
                    <Button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={isCheckingOut}
                    >
                      決済を開始
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      現在のプラン
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
