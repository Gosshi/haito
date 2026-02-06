import Link from 'next/link';

import { DividendBarChart } from '../../components/calendar/dividend-bar-chart';
import { MonthlyCalendar } from '../../components/calendar/monthly-calendar';
import { UnknownMonthSection } from '../../components/calendar/unknown-month-section';
import { LegalFooter } from '../../components/legal/legal-footer';
import { fetchCalendarData } from '../../lib/api/calendar';
import { calculateMonthlyDividends } from '../../lib/calculations/monthly-dividend';

const MONTH_LABELS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
];

export default async function CalendarPage() {
  const result = await fetchCalendarData();

  if (!result.ok) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">配当カレンダー</h1>
          <p className="text-sm text-muted-foreground">
            月別の配当受取予定を確認できます。
          </p>
        </div>
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          データの取得に失敗しました。
        </div>
        <Link className="text-sm text-primary hover:underline" href="/dashboard">
          ダッシュボードへ戻る
        </Link>
        <LegalFooter />
      </main>
    );
  }

  const { holdings } = result.data;
  const hasHoldings = holdings.length > 0;

  if (!hasHoldings) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">配当カレンダー</h1>
          <p className="text-sm text-muted-foreground">
            月別の配当受取予定を確認できます。
          </p>
        </div>
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          銘柄を登録してください
        </div>
        <Link className="text-sm text-primary hover:underline" href="/dashboard">
          ダッシュボードへ戻る
        </Link>
        <LegalFooter />
      </main>
    );
  }

  const dividendResult = calculateMonthlyDividends(holdings);
  const chartData = dividendResult.months.map((monthData) => ({
    month: MONTH_LABELS[monthData.month - 1],
    amount: monthData.total,
    entries: monthData.entries,
  }));

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">配当カレンダー</h1>
        <p className="text-sm text-muted-foreground">
          月別の配当受取予定を確認できます。
        </p>
      </div>
      <Link className="text-sm text-primary hover:underline" href="/dashboard">
        ダッシュボードへ戻る
      </Link>
      <DividendBarChart data={chartData} />
      <MonthlyCalendar months={dividendResult.months} />
      {dividendResult.unknownMonthHoldings.length > 0 && (
        <UnknownMonthSection
          holdings={dividendResult.unknownMonthHoldings}
          total={dividendResult.unknownMonthTotal}
        />
      )}
      <LegalFooter />
    </main>
  );
}
