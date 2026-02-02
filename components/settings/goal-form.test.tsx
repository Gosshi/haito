/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { GoalForm } from './goal-form';
import * as settingsStore from '../../stores/settings-store';
import * as toastStore from '../../stores/toast-store';
import type { UserSettings } from '../../lib/settings/types';

vi.mock('../../stores/settings-store');
vi.mock('../../stores/toast-store');

const mockSettings: UserSettings = {
  annual_dividend_goal: 1500000,
  goal_deadline_year: 2030,
  display_currency: 'JPY',
};

const mockEmptySettings: UserSettings = {
  annual_dividend_goal: null,
  goal_deadline_year: null,
  display_currency: 'JPY',
};

describe('GoalForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
      const state = {
        settings: null,
        isLoading: false,
        error: null,
        fetchSettings: vi.fn(),
        updateSettings: vi.fn().mockResolvedValue({ ok: true }),
        clearSettings: vi.fn().mockResolvedValue({ ok: true }),
      };
      return selector(state);
    });
  });

  describe('タスク3.1: 目標設定フォームコンポーネント', () => {
    it('年間配当目標額（円）の数値入力フィールドを表示する', () => {
      render(<GoalForm />);

      expect(screen.getByLabelText('年間配当目標額（円）')).toBeInTheDocument();
      expect(screen.getByLabelText('年間配当目標額（円）')).toHaveAttribute('type', 'number');
    });

    it('目標達成期限（年）の数値入力フィールドを表示する', () => {
      render(<GoalForm />);

      expect(screen.getByLabelText('目標達成期限（年）')).toBeInTheDocument();
      expect(screen.getByLabelText('目標達成期限（年）')).toHaveAttribute('type', 'number');
    });

    it('ストアから取得した設定値をフォームの初期値として表示する', () => {
      vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
        const state = {
          settings: mockSettings,
          isLoading: false,
          error: null,
          fetchSettings: vi.fn(),
          updateSettings: vi.fn().mockResolvedValue({ ok: true }),
          clearSettings: vi.fn().mockResolvedValue({ ok: true }),
        };
        return selector(state);
      });

      render(<GoalForm />);

      expect(screen.getByLabelText('年間配当目標額（円）')).toHaveValue(1500000);
      expect(screen.getByLabelText('目標達成期限（年）')).toHaveValue(2030);
    });

    it('設定が存在しない場合はフィールドを空で表示する', () => {
      vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
        const state = {
          settings: mockEmptySettings,
          isLoading: false,
          error: null,
          fetchSettings: vi.fn(),
          updateSettings: vi.fn().mockResolvedValue({ ok: true }),
          clearSettings: vi.fn().mockResolvedValue({ ok: true }),
        };
        return selector(state);
      });

      render(<GoalForm />);

      expect(screen.getByLabelText('年間配当目標額（円）')).toHaveValue(null);
      expect(screen.getByLabelText('目標達成期限（年）')).toHaveValue(null);
    });
  });

  describe('タスク3.2: フォームバリデーション', () => {
    it('目標額に0未満の値が入力された場合、エラーメッセージを表示する', async () => {
      render(<GoalForm />);

      const goalInput = screen.getByLabelText('年間配当目標額（円）');
      fireEvent.change(goalInput, { target: { value: '-100' } });

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('目標額は0以上の整数を入力してください')).toBeInTheDocument();
      });
    });

    it('目標額に小数が入力された場合、エラーメッセージを表示する', async () => {
      render(<GoalForm />);

      const goalInput = screen.getByLabelText('年間配当目標額（円）');
      fireEvent.change(goalInput, { target: { value: '100.5' } });

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('目標額は0以上の整数を入力してください')).toBeInTheDocument();
      });
    });

    it('期限年に現在年より前の値が入力された場合、エラーメッセージを表示する', async () => {
      render(<GoalForm />);

      const yearInput = screen.getByLabelText('目標達成期限（年）');
      fireEvent.change(yearInput, { target: { value: '2020' } });

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/期限年は\d{4}年以上2100年以下で入力してください/)).toBeInTheDocument();
      });
    });

    it('期限年に2100より大きい値が入力された場合、エラーメッセージを表示する', async () => {
      render(<GoalForm />);

      const yearInput = screen.getByLabelText('目標達成期限（年）');
      fireEvent.change(yearInput, { target: { value: '2101' } });

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/期限年は\d{4}年以上2100年以下で入力してください/)).toBeInTheDocument();
      });
    });

    it('期限年を空（未設定）のままにすることを許容する', async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue({ ok: true });
      vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
        const state = {
          settings: null,
          isLoading: false,
          error: null,
          fetchSettings: vi.fn(),
          updateSettings: mockUpdateSettings,
          clearSettings: vi.fn().mockResolvedValue({ ok: true }),
        };
        return selector(state);
      });

      render(<GoalForm />);

      const goalInput = screen.getByLabelText('年間配当目標額（円）');
      fireEvent.change(goalInput, { target: { value: '1000000' } });

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          annual_dividend_goal: 1000000,
          goal_deadline_year: null,
        });
      });
    });
  });

  describe('タスク3.3: 保存機能', () => {
    it('保存ボタンクリック時にバリデーションを実行する', async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue({ ok: true });
      vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
        const state = {
          settings: null,
          isLoading: false,
          error: null,
          fetchSettings: vi.fn(),
          updateSettings: mockUpdateSettings,
          clearSettings: vi.fn().mockResolvedValue({ ok: true }),
        };
        return selector(state);
      });

      render(<GoalForm />);

      const goalInput = screen.getByLabelText('年間配当目標額（円）');
      fireEvent.change(goalInput, { target: { value: '-100' } });

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).not.toHaveBeenCalled();
      });
    });

    it('バリデーション成功時にストア経由でAPIに設定を送信する', async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue({ ok: true });
      vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
        const state = {
          settings: null,
          isLoading: false,
          error: null,
          fetchSettings: vi.fn(),
          updateSettings: mockUpdateSettings,
          clearSettings: vi.fn().mockResolvedValue({ ok: true }),
        };
        return selector(state);
      });

      render(<GoalForm />);

      const goalInput = screen.getByLabelText('年間配当目標額（円）');
      const yearInput = screen.getByLabelText('目標達成期限（年）');
      fireEvent.change(goalInput, { target: { value: '1500000' } });
      fireEvent.change(yearInput, { target: { value: '2030' } });

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          annual_dividend_goal: 1500000,
          goal_deadline_year: 2030,
        });
      });
    });

    it('保存成功時に成功トーストを表示する', async () => {
      const mockUpdateSettings = vi.fn().mockResolvedValue({ ok: true });
      vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
        const state = {
          settings: null,
          isLoading: false,
          error: null,
          fetchSettings: vi.fn(),
          updateSettings: mockUpdateSettings,
          clearSettings: vi.fn().mockResolvedValue({ ok: true }),
        };
        return selector(state);
      });

      render(<GoalForm />);

      const goalInput = screen.getByLabelText('年間配当目標額（円）');
      fireEvent.change(goalInput, { target: { value: '1500000' } });

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toastStore.pushToast).toHaveBeenCalledWith('設定を保存しました', 'success');
      });
    });

    it('保存処理中はボタンをローディング状態にし重複クリックを防止する', async () => {
      let resolveUpdate: () => void;
      const updatePromise = new Promise<{ ok: true }>((resolve) => {
        resolveUpdate = () => resolve({ ok: true });
      });
      const mockUpdateSettings = vi.fn().mockReturnValue(updatePromise);

      vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
        const state = {
          settings: null,
          isLoading: false,
          error: null,
          fetchSettings: vi.fn(),
          updateSettings: mockUpdateSettings,
          clearSettings: vi.fn().mockResolvedValue({ ok: true }),
        };
        return selector(state);
      });

      render(<GoalForm />);

      const goalInput = screen.getByLabelText('年間配当目標額（円）');
      fireEvent.change(goalInput, { target: { value: '1500000' } });

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '保存中...' })).toBeDisabled();
      });

      await act(async () => {
        resolveUpdate!();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '保存' })).not.toBeDisabled();
      });
    });
  });

  describe('タスク3.4: クリア機能', () => {
    it('「目標をクリア」ボタンを表示する', () => {
      render(<GoalForm />);

      expect(screen.getByRole('button', { name: '目標をクリア' })).toBeInTheDocument();
    });

    it('クリアボタンクリック時にストア経由で設定削除APIリクエストを送信する', async () => {
      const mockClearSettings = vi.fn().mockResolvedValue({ ok: true });
      vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
        const state = {
          settings: mockSettings,
          isLoading: false,
          error: null,
          fetchSettings: vi.fn(),
          updateSettings: vi.fn().mockResolvedValue({ ok: true }),
          clearSettings: mockClearSettings,
        };
        return selector(state);
      });

      render(<GoalForm />);

      const clearButton = screen.getByRole('button', { name: '目標をクリア' });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockClearSettings).toHaveBeenCalled();
      });
    });

    it('クリア成功時にフォームフィールドを空にリセットする', async () => {
      const mockClearSettings = vi.fn().mockResolvedValue({ ok: true });
      vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
        const state = {
          settings: mockSettings,
          isLoading: false,
          error: null,
          fetchSettings: vi.fn(),
          updateSettings: vi.fn().mockResolvedValue({ ok: true }),
          clearSettings: mockClearSettings,
        };
        return selector(state);
      });

      render(<GoalForm />);

      const clearButton = screen.getByRole('button', { name: '目標をクリア' });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByLabelText('年間配当目標額（円）')).toHaveValue(null);
        expect(screen.getByLabelText('目標達成期限（年）')).toHaveValue(null);
      });
    });

    it('クリア成功時に成功トーストを表示する', async () => {
      const mockClearSettings = vi.fn().mockResolvedValue({ ok: true });
      vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
        const state = {
          settings: mockSettings,
          isLoading: false,
          error: null,
          fetchSettings: vi.fn(),
          updateSettings: vi.fn().mockResolvedValue({ ok: true }),
          clearSettings: mockClearSettings,
        };
        return selector(state);
      });

      render(<GoalForm />);

      const clearButton = screen.getByRole('button', { name: '目標をクリア' });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(toastStore.pushToast).toHaveBeenCalledWith('目標をクリアしました', 'success');
      });
    });
  });
});
