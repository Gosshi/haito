import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUserSettings, updateUserSettings } from './settings';
import type { UserSettings } from '../settings/types';

describe('getUserSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('成功時にUserSettingsを返却する', async () => {
    const mockSettings: UserSettings = {
      annual_dividend_goal: 1500000,
      goal_deadline_year: 2032,
      display_currency: 'JPY',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockSettings }),
    } as Response);

    const result = await getUserSettings();

    expect(result).toEqual(mockSettings);
    expect(fetch).toHaveBeenCalledWith('/api/settings', { method: 'GET' });
  });

  it('APIがエラーを返した場合は例外をスローする', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: false,
          error: { type: 'unauthorized', message: 'Authentication required' },
        }),
    } as Response);

    await expect(getUserSettings()).rejects.toThrow('Authentication required');
  });

  it('HTTPエラーの場合は例外をスローする', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(getUserSettings()).rejects.toThrow();
  });
});

describe('updateUserSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('成功時に更新後のUserSettingsを返却する', async () => {
    const updatedSettings: UserSettings = {
      annual_dividend_goal: 2000000,
      goal_deadline_year: 2035,
      display_currency: 'JPY',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: updatedSettings }),
    } as Response);

    const result = await updateUserSettings({
      annual_dividend_goal: 2000000,
      goal_deadline_year: 2035,
    });

    expect(result).toEqual(updatedSettings);
    expect(fetch).toHaveBeenCalledWith('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        annual_dividend_goal: 2000000,
        goal_deadline_year: 2035,
      }),
    });
  });

  it('部分更新が可能', async () => {
    const updatedSettings: UserSettings = {
      annual_dividend_goal: 1500000,
      goal_deadline_year: null,
      display_currency: 'JPY',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: updatedSettings }),
    } as Response);

    const result = await updateUserSettings({
      annual_dividend_goal: 1500000,
    });

    expect(result).toEqual(updatedSettings);
    expect(fetch).toHaveBeenCalledWith('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annual_dividend_goal: 1500000 }),
    });
  });

  it('goal_deadline_yearをnullでクリア可能', async () => {
    const updatedSettings: UserSettings = {
      annual_dividend_goal: 1500000,
      goal_deadline_year: null,
      display_currency: 'JPY',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: updatedSettings }),
    } as Response);

    const result = await updateUserSettings({
      goal_deadline_year: null,
    });

    expect(result).toEqual(updatedSettings);
    expect(fetch).toHaveBeenCalledWith('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_deadline_year: null }),
    });
  });

  it('APIがエラーを返した場合は例外をスローする', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: false,
          error: {
            type: 'validation',
            message: 'annual_dividend_goal must be 0 or greater',
          },
        }),
    } as Response);

    await expect(
      updateUserSettings({ annual_dividend_goal: -100 })
    ).rejects.toThrow('annual_dividend_goal must be 0 or greater');
  });

  it('HTTPエラーの場合は例外をスローする', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    await expect(
      updateUserSettings({ annual_dividend_goal: 1500000 })
    ).rejects.toThrow();
  });
});
