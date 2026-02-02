import Link from 'next/link';

import { LogoutButton } from '../../components/auth/logout-button';
import { AccountBreakdown } from '../../components/dashboard/account-breakdown';
import { GoalProgressWidget } from '../../components/dashboard/goal-progress-widget';
import { SummaryCard } from '../../components/dashboard/summary-card';
import { fetchDashboardData } from '../../lib/api/dashboard';
import { calculateDividendSummary } from '../../lib/calculations/dividend';

export default async function DashboardPage() {
  const result = await fetchDashboardData();

  if (!result.ok) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">ダッシュボード</h1>
          <p className="text-sm text-muted-foreground">
            年間配当サマリーを確認できます。
          </p>
        </div>
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          データの取得に失敗しました。
        </div>
        <LogoutButton />
      </main>
    );
  }

  const { holdings, missingDividendCodes } = result.data;
  const hasHoldings = holdings.length > 0;
  const summary = hasHoldings ? calculateDividendSummary(holdings) : null;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground">
          年間配当サマリーを確認できます。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link className="text-primary hover:underline" href="/portfolio">
          銘柄一覧へ
        </Link>
        <Link className="text-primary hover:underline" href="/calendar">
          カレンダーへ
        </Link>
        <Link className="text-primary hover:underline" href="/settings">
          設定へ
        </Link>
      </div>
      <GoalProgressWidget currentAnnualDividend={summary?.totalPreTax ?? 0} />
      {!hasHoldings && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          銘柄を登録してください
        </div>
      )}
      {hasHoldings && summary && (
        <>
          {missingDividendCodes.length > 0 && (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              配当データ取得中の銘柄があります。
            </div>
          )}
          <SummaryCard
            totalPreTax={summary.totalPreTax}
            totalAfterTax={summary.totalAfterTax}
            dividendYield={summary.dividendYield}
            totalInvestment={summary.totalInvestment}
          />
          <AccountBreakdown summaries={summary.accountSummaries} />
        </>
      )}
      <LogoutButton />
    </main>
  );
}
