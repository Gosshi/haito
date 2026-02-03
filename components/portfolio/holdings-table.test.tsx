/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { HoldingsTable } from './holdings-table';
import { fetchDividendLookups } from '../../lib/api/dividend-lookups';
import { useHoldingsStore } from '../../stores/holdings-store';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('../../lib/api/dividend-lookups', () => ({
  fetchDividendLookups: vi.fn(),
}));

vi.mock('../../stores/holdings-store', () => ({
  useHoldingsStore: vi.fn(),
}));

vi.mock('./refresh-dividends-button', () => ({
  RefreshDividendsButton: () => <div data-testid="refresh-dividends" />,
}));

vi.mock('./edit-holding-dialog', () => ({
  EditHoldingDialog: () => <div data-testid="edit-dialog" />,
}));

vi.mock('./delete-holding-dialog', () => ({
  DeleteHoldingDialog: () => <div data-testid="delete-dialog" />,
}));

type MockHolding = {
  id: string;
  user_id: string;
  stock_code: string;
  stock_name: string | null;
  shares: number;
  acquisition_price: number | null;
  account_type: 'specific';
  created_at: string | null;
  updated_at: string | null;
};

describe('HoldingsTable', () => {
  const mockRouter = { push: vi.fn() };
  const fetchHoldings = vi.fn();

  const holdings: MockHolding[] = [
    {
      id: '1',
      user_id: 'user-1',
      stock_code: '7203',
      stock_name: 'トヨタ',
      shares: 10,
      acquisition_price: 100,
      account_type: 'specific',
      created_at: null,
      updated_at: null,
    },
    {
      id: '2',
      user_id: 'user-1',
      stock_code: '8306',
      stock_name: '三菱UFJ',
      shares: 20,
      acquisition_price: 200,
      account_type: 'specific',
      created_at: null,
      updated_at: null,
    },
    {
      id: '3',
      user_id: 'user-1',
      stock_code: '9999',
      stock_name: null,
      shares: 5,
      acquisition_price: null,
      account_type: 'specific',
      created_at: null,
      updated_at: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue(mockRouter);
    (useHoldingsStore as Mock).mockImplementation((selector) =>
      selector({
        holdings,
        isLoading: false,
        error: null,
        fetchHoldings,
      })
    );
    (fetchDividendLookups as Mock).mockResolvedValue({
      ok: true,
      data: [
        { stockCode: '7203', annualDividend: 50 },
        { stockCode: '8306', annualDividend: 20 },
        { stockCode: '9999', annualDividend: null },
      ],
    });
  });

  it('配当利回りカラムと平均利回りを表示する', async () => {
    render(<HoldingsTable />);

    await waitFor(() => {
      expect(fetchDividendLookups).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('配当利回り')).toBeInTheDocument();
    expect(screen.getByText('平均配当利回り')).toBeInTheDocument();
    expect(screen.getByText('18.00%')).toBeInTheDocument();

    const rows = screen.getAllByRole('row').slice(1);
    const firstRowCells = within(rows[0]).getAllByRole('cell');
    const secondRowCells = within(rows[1]).getAllByRole('cell');
    const thirdRowCells = within(rows[2]).getAllByRole('cell');

    expect(firstRowCells[0]).toHaveTextContent('7203');
    expect(firstRowCells[4]).toHaveTextContent('50.00%');

    expect(secondRowCells[0]).toHaveTextContent('8306');
    expect(secondRowCells[4]).toHaveTextContent('10.00%');

    expect(thirdRowCells[0]).toHaveTextContent('9999');
    expect(thirdRowCells[4]).toHaveTextContent('-');
  });

  it('ソート変更で行順が更新され、追加取得が発生しない', async () => {
    render(<HoldingsTable />);

    await waitFor(() => {
      expect(fetchDividendLookups).toHaveBeenCalledTimes(1);
    });

    const select = screen.getByLabelText('並べ替え');
    fireEvent.change(select, { target: { value: 'yield_asc' } });

    const rows = screen.getAllByRole('row').slice(1);
    const firstRowCells = within(rows[0]).getAllByRole('cell');
    const secondRowCells = within(rows[1]).getAllByRole('cell');

    expect(firstRowCells[0]).toHaveTextContent('8306');
    expect(secondRowCells[0]).toHaveTextContent('7203');
    expect(fetchDividendLookups).toHaveBeenCalledTimes(1);
  });

  it('年間配当額ソートで配当未取得の銘柄を末尾にする', async () => {
    render(<HoldingsTable />);

    await waitFor(() => {
      expect(fetchDividendLookups).toHaveBeenCalledTimes(1);
    });

    const select = screen.getByLabelText('並べ替え');
    fireEvent.change(select, { target: { value: 'annual_dividend_asc' } });

    const rows = screen.getAllByRole('row').slice(1);
    const firstRowCells = within(rows[0]).getAllByRole('cell');
    const secondRowCells = within(rows[1]).getAllByRole('cell');
    const thirdRowCells = within(rows[2]).getAllByRole('cell');

    expect(firstRowCells[0]).toHaveTextContent('8306');
    expect(secondRowCells[0]).toHaveTextContent('7203');
    expect(thirdRowCells[0]).toHaveTextContent('9999');
  });
});
