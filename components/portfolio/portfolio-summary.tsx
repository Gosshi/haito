import { formatPercent } from '../../lib/portfolio/format';

export type PortfolioSummaryProps = {
  averageYield: number;
};

export function PortfolioSummary({ averageYield }: PortfolioSummaryProps) {
  return (
    <div className="space-y-1 rounded-md border border-border bg-muted/30 px-4 py-3">
      <p className="text-sm text-muted-foreground">平均配当利回り</p>
      <p className="text-lg font-semibold">{formatPercent(averageYield)}</p>
    </div>
  );
}
