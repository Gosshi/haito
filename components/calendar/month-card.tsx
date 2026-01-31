import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';

import type { MonthDividendEntry } from '../../lib/calendar/types';

type MonthCardProps = {
  month: number;
  entries: MonthDividendEntry[];
  total: number;
};

const formatCurrency = (amount: number): string =>
  `¥${amount.toLocaleString('ja-JP')}`;

export const MonthCard = ({ month, entries, total }: MonthCardProps) => (
  <Card>
    <CardHeader className="p-4 pb-2">
      <CardTitle className="text-base font-medium">{month}月</CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{formatCurrency(0)}</p>
      ) : (
        <>
          <ul className="space-y-1 text-sm">
            {entries.map((entry, index) => (
              <li key={`${entry.stockCode}-${index}`} className="flex justify-between">
                <span className="truncate pr-2">
                  {entry.stockName ?? entry.stockCode}
                </span>
                <span className="shrink-0">{formatCurrency(entry.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t pt-2 text-sm font-medium">
            <span>合計: </span>
            <span>{formatCurrency(total)}</span>
          </div>
        </>
      )}
    </CardContent>
  </Card>
);
