import { formatCurrencyJPY } from '../../lib/dashboard/format';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const formatPercent = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '-';
  }

  return `${value.toFixed(2)}%`;
};

type SummaryCardProps = {
  totalPreTax: number;
  totalAfterTax: number;
  dividendYield: number;
  totalInvestment: number;
};

export function SummaryCard({
  totalPreTax,
  totalAfterTax,
  dividendYield,
  totalInvestment,
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>年間配当サマリー</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">年間配当（税引前）</p>
            <p className="text-2xl font-semibold">
              {formatCurrencyJPY(totalPreTax)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">年間配当（税引後）</p>
            <p className="text-2xl font-semibold">
              {formatCurrencyJPY(totalAfterTax)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">配当利回り</p>
            <p className="text-2xl font-semibold">{formatPercent(dividendYield)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">総投資額</p>
            <p className="text-2xl font-semibold">
              {formatCurrencyJPY(totalInvestment)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
