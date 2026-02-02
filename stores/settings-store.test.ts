import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSettingsStore, type SettingsActionResult } from './settings-store';
import * as settingsApi from '../lib/api/settings';
import * as toastStore from './toast-store';
import type { UserSettings } from '../lib/settings/types';

vi.mock('../lib/api/settings');
vi.mock('./toast-store');

const mockSettings: UserSettings = {
  annual_dividend_goal: 1500000,
  goal_deadline_year: 2032,
  display_currency: 'JPY',
};

const mockEmptySettings: UserSettings = {
  annual_dividend_goal: null,
  goal_deadline_year: null,
  display_currency: 'JPY',
};

describe('useSettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    useSettingsStore.setState({
      settings: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初期状態', () => {
    it('settingsがnull、isLoadingがfalse、errorがnullで初期化される', () => {
      const state = useSettingsStore.getState();

      expect(state.settings).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchSettings', () => {
    it('成功時にsettingsを更新する', async () => {
      vi.mocked(settingsApi.getUserSettings).mockResolvedValueOnce(mockSettings);

      await useSettingsStore.getState().fetchSettings();

      const state = useSettingsStore.getState();
      expect(state.settings).toEqual(mockSettings);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('ローディング中はisLoadingがtrueになる', async () => {
      let resolvePromise: (value: UserSettings) => void;
      const promise = new Promise<UserSettings>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(settingsApi.getUserSettings).mockReturnValueOnce(promise);

      const fetchPromise = useSettingsStore.getState().fetchSettings();

      // ローディング中の状態を確認
      expect(useSettingsStore.getState().isLoading).toBe(true);

      resolvePromise!(mockSettings);
      await fetchPromise;

      expect(useSettingsStore.getState().isLoading).toBe(false);
    });

    it('エラー時にerrorを設定しpushToastを呼び出す', async () => {
      vi.mocked(settingsApi.getUserSettings).mockRejectedValueOnce(
        new Error('Network error')
      );

      await useSettingsStore.getState().fetchSettings();

      const state = useSettingsStore.getState();
      expect(state.settings).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(toastStore.pushToast).toHaveBeenCalledWith(
        '設定の取得に失敗しました。',
        'error'
      );
    });
  });

  describe('updateSettings', () => {
    it('成功時にsettingsを更新しokを返す', async () => {
      vi.mocked(settingsApi.updateUserSettings).mockResolvedValueOnce(mockSettings);

      const result = await useSettingsStore.getState().updateSettings({
        annual_dividend_goal: 1500000,
        goal_deadline_year: 2032,
      });

      expect(result).toEqual({ ok: true });
      const state = useSettingsStore.getState();
      expect(state.settings).toEqual(mockSettings);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('エラー時にerrorを設定しpushToastを呼び出す', async () => {
      vi.mocked(settingsApi.updateUserSettings).mockRejectedValueOnce(
        new Error('Validation failed')
      );

      const result = await useSettingsStore.getState().updateSettings({
        annual_dividend_goal: -100,
      });

      expect(result).toEqual({
        ok: false,
        error: 'Validation failed',
        errorType: 'unknown',
      });
      const state = useSettingsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Validation failed');
      expect(toastStore.pushToast).toHaveBeenCalledWith(
        '設定の保存に失敗しました。',
        'error'
      );
    });

    it('ローディング中はisLoadingがtrueになる', async () => {
      let resolvePromise: (value: UserSettings) => void;
      const promise = new Promise<UserSettings>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(settingsApi.updateUserSettings).mockReturnValueOnce(promise);

      const updatePromise = useSettingsStore.getState().updateSettings({
        annual_dividend_goal: 1500000,
      });

      expect(useSettingsStore.getState().isLoading).toBe(true);

      resolvePromise!(mockSettings);
      await updatePromise;

      expect(useSettingsStore.getState().isLoading).toBe(false);
    });
  });

  describe('clearSettings', () => {
    it('成功時にsettingsをクリアしokを返す', async () => {
      vi.mocked(settingsApi.updateUserSettings).mockResolvedValueOnce(mockEmptySettings);

      // まず設定がある状態にする
      useSettingsStore.setState({ settings: mockSettings });

      const result = await useSettingsStore.getState().clearSettings();

      expect(result).toEqual({ ok: true });
      const state = useSettingsStore.getState();
      expect(state.settings).toEqual(mockEmptySettings);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // updateUserSettingsがnull値で呼び出されたことを確認
      expect(settingsApi.updateUserSettings).toHaveBeenCalledWith({
        annual_dividend_goal: null,
        goal_deadline_year: null,
      });
    });

    it('エラー時にerrorを設定しpushToastを呼び出す', async () => {
      vi.mocked(settingsApi.updateUserSettings).mockRejectedValueOnce(
        new Error('Server error')
      );

      const result = await useSettingsStore.getState().clearSettings();

      expect(result).toEqual({
        ok: false,
        error: 'Server error',
        errorType: 'unknown',
      });
      const state = useSettingsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Server error');
      expect(toastStore.pushToast).toHaveBeenCalledWith(
        '設定のクリアに失敗しました。',
        'error'
      );
    });
  });
});
