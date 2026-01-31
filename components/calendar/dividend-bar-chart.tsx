'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { MonthDividendEntry } from '../../lib/calendar/types';

type ChartDataPoint = {
  month: string;
  amount: number;
  entries: MonthDividendEntry[];
};

type DividendBarChartProps = {
  data: ChartDataPoint[];
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
  label?: string;
};

const formatCurrency = (amount: number): string =>
  `¥${amount.toLocaleString('ja-JP')}`;

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 font-medium">{data.month}</p>
      <p className="mb-1 text-sm">合計: {formatCurrency(data.amount)}</p>
      {data.entries.length > 0 && (
        <ul className="mt-2 space-y-1 border-t pt-2 text-xs text-muted-foreground">
          {data.entries.map((entry, index) => (
            <li key={`${entry.stockCode}-${index}`} className="flex justify-between gap-2">
              <span className="truncate">{entry.stockName ?? entry.stockCode}</span>
              <span>{formatCurrency(entry.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const DividendBarChart = ({ data }: DividendBarChartProps) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <XAxis
        dataKey="month"
        tick={{ fontSize: 12 }}
        tickLine={false}
        axisLine={false}
      />
      <YAxis
        tick={{ fontSize: 12 }}
        tickLine={false}
        axisLine={false}
        tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
      />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
