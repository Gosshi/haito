'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { AccountType, Holding } from '../../lib/holdings/types';
import { fetchDividendLookups } from '../../lib/api/dividend-lookups';
import {
  calculateHoldingYield,
  calculatePortfolioYield,
} from '../../lib/calculations/portfolio-yield';
import { formatPercent } from '../../lib/portfolio/format';
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
import { DeleteHoldingDialog } from './delete-holding-dialog';
import { EditHoldingDialog } from './edit-holding-dialog';
import { PortfolioSummary } from './portfolio-summary';
import { RefreshDividendsButton } from './refresh-dividends-button';
import { SortDropdown, type SortOption } from './sort-dropdown';

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

type PortfolioHoldingView = Holding & {
  annualDividend: number | null;
  annualDividendAmount: number;
  investmentAmount: number;
  yieldPercent: number | null;
};

const compareNullableNumber = (
  left: number | null,
  right: number | null,
  direction: 'asc' | 'desc'
): number => {
  const leftNull = left === null || !Number.isFinite(left);
  const rightNull = right === null || !Number.isFinite(right);

  if (leftNull && rightNull) {
    return 0;
  }

  if (leftNull) {
    return 1;
  }

  if (rightNull) {
    return -1;
  }

  return direction === 'asc' ? left - right : right - left;
};

const annualDividendSortValue = (
  holding: PortfolioHoldingView
): number | null => {
  if (holding.annualDividend === null || !Number.isFinite(holding.annualDividend)) {
    return null;
  }

  return holding.annualDividendAmount;
};

const sortHoldings = (
  holdings: PortfolioHoldingView[],
  option: SortOption
): PortfolioHoldingView[] => {
  const indexed = holdings.map((holding, index) => ({ holding, index }));

  indexed.sort((a, b) => {
    switch (option) {
      case 'yield_desc': {
        const diff = compareNullableNumber(
          a.holding.yieldPercent,
          b.holding.yieldPercent,
          'desc'
        );
        return diff !== 0 ? diff : a.index - b.index;
      }
      case 'yield_asc': {
        const diff = compareNullableNumber(
          a.holding.yieldPercent,
          b.holding.yieldPercent,
          'asc'
        );
        return diff !== 0 ? diff : a.index - b.index;
      }
      case 'annual_dividend_desc': {
        const diff = compareNullableNumber(
          annualDividendSortValue(a.holding),
          annualDividendSortValue(b.holding),
          'desc'
        );
        return diff !== 0 ? diff : a.index - b.index;
      }
      case 'annual_dividend_asc': {
        const diff = compareNullableNumber(
          annualDividendSortValue(a.holding),
          annualDividendSortValue(b.holding),
          'asc'
        );
        return diff !== 0 ? diff : a.index - b.index;
      }
      case 'stock_code_asc':
      default: {
        const diff = a.holding.stock_code.localeCompare(b.holding.stock_code);
        return diff !== 0 ? diff : a.index - b.index;
      }
    }
  });

  return indexed.map(({ holding }) => holding);
};

export function HoldingsTable() {
  const router = useRouter();
  const holdings = useHoldingsStore((state) => state.holdings);
  const isLoading = useHoldingsStore((state) => state.isLoading);
  const error = useHoldingsStore((state) => state.error);
  const fetchHoldings = useHoldingsStore((state) => state.fetchHoldings);
  const [sortOption, setSortOption] = useState<SortOption>('yield_desc');
  const [dividendMap, setDividendMap] = useState<Map<string, number | null>>(
    () => new Map()
  );
  const [dividendError, setDividendError] = useState<string | null>(null);

  useEffect(() => {
    void fetchHoldings();
  }, [fetchHoldings]);

  useEffect(() => {
    if (holdings.length === 0) {
      setDividendMap(new Map());
      setDividendError(null);
      return;
    }

    let active = true;
    const loadDividends = async () => {
      const result = await fetchDividendLookups(
        holdings.map((holding) => holding.stock_code)
      );
      if (!active) {
        return;
      }

      if (!result.ok) {
        setDividendError(result.error.message);
        setDividendMap(new Map());
        return;
      }

      const nextMap = new Map<string, number | null>();
      result.data.forEach((row) => {
        nextMap.set(row.stockCode, row.annualDividend ?? null);
      });
      setDividendMap(nextMap);
      setDividendError(null);
    };

    void loadDividends();
    return () => {
      active = false;
    };
  }, [holdings]);

  const portfolioHoldings = useMemo<PortfolioHoldingView[]>(() => {
    return holdings.map((holding) => {
      const annualDividend = dividendMap.get(holding.stock_code) ?? null;
      const yieldResult = calculateHoldingYield({
        stockCode: holding.stock_code,
        shares: holding.shares,
        acquisitionPrice: holding.acquisition_price,
        annualDividend,
      });

      return {
        ...holding,
        annualDividend,
        annualDividendAmount: yieldResult.annualDividendAmount,
        investmentAmount: yieldResult.investmentAmount,
        yieldPercent: yieldResult.yieldPercent,
      };
    });
  }, [holdings, dividendMap]);

  const portfolioSummary = useMemo(() => {
    return calculatePortfolioYield(
      portfolioHoldings.map((holding) => ({
        stockCode: holding.stock_code,
        shares: holding.shares,
        acquisitionPrice: holding.acquisition_price,
        annualDividend: holding.annualDividend,
      }))
    );
  }, [portfolioHoldings]);

  const sortedHoldings = useMemo(
    () => sortHoldings(portfolioHoldings, sortOption),
    [portfolioHoldings, sortOption]
  );

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
        <div className="flex items-center gap-2">
          <RefreshDividendsButton />
          <Link
            href="/portfolio/import"
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            CSVインポート
          </Link>
          <Button type="button" onClick={handleAddHolding}>
            銘柄を追加
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {dividendError && (
          <p className="text-sm text-red-600">
            配当データの取得に失敗しました: {dividendError}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <PortfolioSummary averageYield={portfolioSummary.averageYield} />
          <SortDropdown
            value={sortOption}
            onChange={setSortOption}
            showStatus={true}
          />
        </div>
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
                <TableHead className="text-right">配当利回り</TableHead>
                <TableHead>口座種別</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHoldings.map((holding) => (
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
                  <TableCell className="text-right">
                    {formatPercent(holding.yieldPercent)}
                  </TableCell>
                  <TableCell>{formatAccountType(holding.account_type)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <EditHoldingDialog holding={holding} />
                      <DeleteHoldingDialog holding={holding} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
