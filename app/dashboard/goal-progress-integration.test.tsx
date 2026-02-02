/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { UserSettings } from '../../lib/settings/types';

const mockFetchSettings = vi.fn();

type MockState = {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => void;
};

let mockState: MockState = {
  settings: null,
  isLoading: false,
  error: null,
  fetchSettings: mockFetchSettings,
};

vi.mock('../../stores/settings-store', () => ({
  useSettingsStore: vi.fn((selector: (state: MockState) => unknown) => selector(mockState)),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { GoalProgressWidget } from '../../components/dashboard/goal-progress-widget';

describe('GoalProgressWidget Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      settings: null,
      isLoading: false,
      error: null,
      fetchSettings: mockFetchSettings,
    };
  });

  describe('widget display with goal set', () => {
    beforeEach(() => {
      mockState = {
        settings: {
          annual_dividend_goal: 1500000,
          goal_deadline_year: 2030,
          display_currency: 'JPY',
        },
        isLoading: false,
        error: null,
        fetchSettings: mockFetchSettings,
      };
    });

    it('displays all required information for goal progress', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} currentYear={2024} />);

      // 目標額
      expect(screen.getByText('¥1,500,000')).toBeDefined();
      // 現在の年間配当
      expect(screen.getByText('¥180,000')).toBeDefined();
      // 達成率
      expect(screen.getByText('12%')).toBeDefined();
      // プログレスバー
      expect(screen.getByRole('progressbar')).toBeDefined();
      // 残り年数
      expect(screen.getByText(/残り6年/)).toBeDefined();
    });

    it('displays investment estimation when goal not achieved', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);

      // 残り必要配当額
      expect(screen.getByText('¥1,320,000')).toBeDefined();
      // 必要投資額
      expect(screen.getByText('¥33,000,000')).toBeDefined();
    });
  });

  describe('widget display with goal not set', () => {
    beforeEach(() => {
      mockState = {
        settings: {
          annual_dividend_goal: null,
          goal_deadline_year: null,
          display_currency: 'JPY',
        },
        isLoading: false,
        error: null,
        fetchSettings: mockFetchSettings,
      };
    });

    it('displays CTA and link to settings page', () => {
      render(<GoalProgressWidget currentAnnualDividend={0} />);

      // CTAメッセージ
      expect(screen.getByText('目標を設定しましょう')).toBeDefined();
      // 設定ページへのリンク
      const link = screen.getByRole('link', { name: /設定ページへ/ });
      expect(link.getAttribute('href')).toBe('/settings');
    });

    it('does not display progress bar when goal not set', () => {
      render(<GoalProgressWidget currentAnnualDividend={0} />);
      expect(screen.queryByRole('progressbar')).toBeNull();
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      mockState = {
        settings: null,
        isLoading: true,
        error: null,
        fetchSettings: mockFetchSettings,
      };
    });

    it('displays loading skeleton while fetching settings', () => {
      render(<GoalProgressWidget currentAnnualDividend={0} />);
      expect(screen.getByTestId('loading-skeleton')).toBeDefined();
    });
  });
});
