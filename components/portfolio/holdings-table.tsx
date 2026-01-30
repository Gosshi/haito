'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import type { AccountType, Holding } from '../../lib/holdings/types';
import { useHoldingsStore } from '../../stores/holdings-store';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

const accountTypeLabels: Record<AccountType, string> = {
  specific: '特定口座',
  nisa_growth: 'NISA成長投資枠',
  nisa_tsumitate: 'NISAつみたて投資枠',
  nisa_legacy: '旧NISA',
};

const formatAccountType = (value: AccountType): string =>
  accountTypeLabels[value] ?? value;

const formatShares = (value: number): string => value.toLocaleString();

const formatAcquisitionPrice = (value: number | null): string =>
  typeof value === 'number' ? value.toLocaleString() : '-';

const renderStockName = (value: Holding['stock_name']): string =>
  value && value.trim().length > 0 ? value : '-';

export function HoldingsTable() {
  const router = useRouter();
  const holdings = useHoldingsStore((state) => state.holdings);
  const isLoading = useHoldingsStore((state) => state.isLoading);
  const error = useHoldingsStore((state) => state.error);
  const fetchHoldings = useHoldingsStore((state) => state.fetchHoldings);

  useEffect(() => {
    void fetchHoldings();
  }, [fetchHoldings]);

  const handleAddHolding = () => {
    router.push('/portfolio/add');
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>保有銘柄一覧</CardTitle>
          <CardDescription>
            登録済みの銘柄を一覧で確認できます。
          </CardDescription>
        </div>
        <Button type="button" onClick={handleAddHolding}>
          銘柄を追加
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {isLoading && (
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        )}
        {!isLoading && holdings.length === 0 && (
          <div className="space-y-3 rounded-md border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              まだ銘柄が登録されていません。
            </p>
            <Button type="button" onClick={handleAddHolding}>
              銘柄を追加
            </Button>
          </div>
        )}
        {!isLoading && holdings.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>銘柄コード</TableHead>
                <TableHead>銘柄名</TableHead>
                <TableHead className="text-right">保有株数</TableHead>
                <TableHead className="text-right">取得単価</TableHead>
                <TableHead>口座種別</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => (
                <TableRow key={holding.id}>
                  <TableCell className="font-medium">
                    {holding.stock_code}
                  </TableCell>
                  <TableCell>{renderStockName(holding.stock_name)}</TableCell>
                  <TableCell className="text-right">
                    {formatShares(holding.shares)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAcquisitionPrice(holding.acquisition_price)}
                  </TableCell>
                  <TableCell>{formatAccountType(holding.account_type)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
