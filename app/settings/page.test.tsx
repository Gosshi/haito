/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SettingsPage from './page';
import * as settingsStore from '../../stores/settings-store';

vi.mock('../../stores/settings-store');

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockFetchSettings = vi.fn();
    vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
      const state = {
        settings: null,
        isLoading: false,
        error: null,
        fetchSettings: mockFetchSettings,
        updateSettings: vi.fn().mockResolvedValue({ ok: true }),
        clearSettings: vi.fn().mockResolvedValue({ ok: true }),
      };
      return selector(state);
    });
  });

  describe('タスク4.1: 設定ページ', () => {
    it('/settingsルートでページを表示する', () => {
      render(<SettingsPage />);

      expect(screen.getByText('設定')).toBeInTheDocument();
    });

    it('ページ説明を表示する', () => {
      render(<SettingsPage />);

      expect(screen.getByText('年間配当目標を設定できます。')).toBeInTheDocument();
    });

    it('目標設定フォームコンポーネントを配置する', () => {
      render(<SettingsPage />);

      expect(screen.getByText('目標設定')).toBeInTheDocument();
      expect(screen.getByLabelText('年間配当目標額（円）')).toBeInTheDocument();
    });

    it('ページマウント時にストアから設定を取得する', () => {
      const mockFetchSettings = vi.fn();
      vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
        const state = {
          settings: null,
          isLoading: false,
          error: null,
          fetchSettings: mockFetchSettings,
          updateSettings: vi.fn().mockResolvedValue({ ok: true }),
          clearSettings: vi.fn().mockResolvedValue({ ok: true }),
        };
        return selector(state);
      });

      render(<SettingsPage />);

      expect(mockFetchSettings).toHaveBeenCalled();
    });

    it('ダッシュボードへのリンクを表示する', () => {
      render(<SettingsPage />);

      const link = screen.getByRole('link', { name: 'ダッシュボードへ' });
      expect(link).toHaveAttribute('href', '/dashboard');
    });
  });
});
