import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDividendLookups } from './dividend-lookups';

vi.mock('../supabase/client', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '../supabase/client';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('fetchDividendLookups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('codesが空の場合は空配列を返し、Supabaseを呼び出さない', async () => {
    const result = await fetchDividendLookups([]);

    expect(result).toEqual({ ok: true, data: [] });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('重複コードを除外して配当データを取得する', async () => {
    const inSpy = vi.fn().mockResolvedValue({
      data: [{ stock_code: '7203', annual_dividend: '120.5' }],
      error: null,
    });
    const selectSpy = vi.fn().mockReturnValue({ in: inSpy });
    const fromSpy = vi.fn().mockReturnValue({ select: selectSpy });

    mockCreateClient.mockReturnValue({ from: fromSpy });

    const result = await fetchDividendLookups([' 7203 ', '7203', '8306']);

    expect(fromSpy).toHaveBeenCalledWith('dividend_data');
    expect(selectSpy).toHaveBeenCalledWith('stock_code, annual_dividend');
    expect(inSpy).toHaveBeenCalledWith('stock_code', ['7203', '8306']);
    expect(result).toEqual({
      ok: true,
      data: [{ stockCode: '7203', annualDividend: 120.5 }],
    });
  });

  it('取得エラー時はok=falseで返す', async () => {
    const inSpy = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'fetch failed' },
    });
    const selectSpy = vi.fn().mockReturnValue({ in: inSpy });
    const fromSpy = vi.fn().mockReturnValue({ select: selectSpy });

    mockCreateClient.mockReturnValue({ from: fromSpy });

    const result = await fetchDividendLookups(['7203']);

    expect(result).toEqual({
      ok: false,
      error: { message: 'fetch failed' },
    });
  });
});
