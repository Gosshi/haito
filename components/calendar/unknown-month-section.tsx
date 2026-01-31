import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';

import type { UnknownMonthHolding } from '../../lib/calendar/types';

type UnknownMonthSectionProps = {
  holdings: UnknownMonthHolding[];
  total: number;
};

const formatCurrency = (amount: number): string =>
  `¥${amount.toLocaleString('ja-JP')}`;

export const UnknownMonthSection = ({
  holdings,
  total,
}: UnknownMonthSectionProps) => {
  if (holdings.length === 0) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">
          支払月不明
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ul className="space-y-1 text-sm">
          {holdings.map((holding, index) => (
            <li
              key={`${holding.stockCode}-${index}`}
              className="flex justify-between"
            >
              <span className="truncate pr-2">
                {holding.stockName ?? holding.stockCode}
              </span>
              <span className="shrink-0">
                {formatCurrency(holding.annualDividendAfterTax)}/年
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t pt-2 text-sm">
          <span className="text-muted-foreground">年間合計（参考）: </span>
          <span className="font-medium">{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
};
