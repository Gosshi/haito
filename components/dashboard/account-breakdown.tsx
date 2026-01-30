import type { AccountDividendSummary } from '../../lib/calculations/dividend';
import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const accountLabels: Record<AccountDividendSummary['accountType'], string> = {
  specific: '特定口座',
  nisa_growth: 'NISA成長投資枠',
  nisa_tsumitate: 'NISAつみたて投資枠',
};

type AccountBreakdownProps = {
  summaries: AccountDividendSummary[];
};

export function AccountBreakdown({ summaries }: AccountBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>口座種別ごとの内訳</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaries.map((summary) => (
          <div
            key={summary.accountType}
            className="rounded-md border px-4 py-3"
          >
            <div className="text-sm font-semibold">
              {accountLabels[summary.accountType]}
            </div>
            <div className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-muted-foreground">税引前</p>
                <p className="text-base font-semibold">
                  {formatCurrencyJPY(summary.preTax)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">税引後</p>
                <p className="text-base font-semibold">
                  {formatCurrencyJPY(summary.afterTax)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
