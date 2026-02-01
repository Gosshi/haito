'use client';

import { create } from 'zustand';

import type {
  UserSettings,
  UpdateUserSettingsRequest,
  SettingsErrorType,
} from '../lib/settings/types';
import {
  getUserSettings,
  updateUserSettings,
} from '../lib/api/settings';
import { pushToast } from './toast-store';

export type SettingsActionResult =
  | { ok: true }
  | { ok: false; error: string; errorType: SettingsErrorType };

type SettingsState = {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (input: UpdateUserSettingsRequest) => Promise<SettingsActionResult>;
  clearSettings: () => Promise<SettingsActionResult>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,
  fetchSettings: async () => {
    set({ isLoading: true, error: null });

    try {
      const settings = await getUserSettings();
      set({ settings, isLoading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ isLoading: false, error: message });
      pushToast('設定の取得に失敗しました。', 'error');
    }
  },
  updateSettings: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const settings = await updateUserSettings(input);
      set({ settings, isLoading: false, error: null });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ isLoading: false, error: message });
      pushToast('設定の保存に失敗しました。', 'error');
      return { ok: false, error: message, errorType: 'unknown' as SettingsErrorType };
    }
  },
  clearSettings: async () => {
    set({ isLoading: true, error: null });

    try {
      const settings = await updateUserSettings({
        annual_dividend_goal: null,
        goal_deadline_year: null,
      });
      set({ settings, isLoading: false, error: null });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ isLoading: false, error: message });
      pushToast('設定のクリアに失敗しました。', 'error');
      return { ok: false, error: message, errorType: 'unknown' as SettingsErrorType };
    }
  },
}));
