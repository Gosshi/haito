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

import { GoalProgressWidget } from './goal-progress-widget';

describe('GoalProgressWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      settings: null,
      isLoading: false,
      error: null,
      fetchSettings: mockFetchSettings,
    };
  });

  describe('when goal is set', () => {
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

    it('displays goal amount in JPY format', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      expect(screen.getByText('¥1,500,000')).toBeDefined();
    });

    it('displays current annual dividend in JPY format', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      expect(screen.getByText('¥180,000')).toBeDefined();
    });

    it('displays achievement rate as percentage', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      expect(screen.getByText('12%')).toBeDefined();
    });

    it('displays progress bar', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeDefined();
    });

    it('displays remaining years when deadline is set', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} currentYear={2024} />);
      expect(screen.getByText(/残り6年/)).toBeDefined();
    });

    it('displays remaining dividend needed', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      expect(screen.getByText('¥1,320,000')).toBeDefined();
    });

    it('displays required investment at 4% yield', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      expect(screen.getByText('¥33,000,000')).toBeDefined();
    });
  });

  describe('when goal achievement exceeds 100%', () => {
    beforeEach(() => {
      mockState = {
        settings: {
          annual_dividend_goal: 1000000,
          goal_deadline_year: null,
          display_currency: 'JPY',
        },
        isLoading: false,
        error: null,
        fetchSettings: mockFetchSettings,
      };
    });

    it('displays achievement rate over 100%', () => {
      render(<GoalProgressWidget currentAnnualDividend={1200000} />);
      expect(screen.getByText('120%')).toBeDefined();
    });

    it('does not display investment estimation when goal achieved', () => {
      render(<GoalProgressWidget currentAnnualDividend={1200000} />);
      expect(screen.queryByText(/必要投資額/)).toBeNull();
    });
  });

  describe('when goal is not set', () => {
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

    it('displays CTA message', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      expect(screen.getByText('目標を設定しましょう')).toBeDefined();
    });

    it('displays link to settings page', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      const link = screen.getByRole('link', { name: /設定ページへ/ });
      expect(link).toBeDefined();
      expect(link.getAttribute('href')).toBe('/settings');
    });

    it('does not display progress bar', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      expect(screen.queryByRole('progressbar')).toBeNull();
    });

    it('does not display achievement rate', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      expect(screen.queryByText(/%$/)).toBeNull();
    });
  });

  describe('when deadline is exceeded', () => {
    beforeEach(() => {
      mockState = {
        settings: {
          annual_dividend_goal: 1500000,
          goal_deadline_year: 2023,
          display_currency: 'JPY',
        },
        isLoading: false,
        error: null,
        fetchSettings: mockFetchSettings,
      };
    });

    it('displays deadline exceeded message', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} currentYear={2024} />);
      expect(screen.getByText('期限を過ぎています')).toBeDefined();
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

    it('displays loading skeleton', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      expect(screen.getByTestId('loading-skeleton')).toBeDefined();
    });
  });

  describe('settings fetch', () => {
    beforeEach(() => {
      mockState = {
        settings: null,
        isLoading: false,
        error: null,
        fetchSettings: mockFetchSettings,
      };
    });

    it('calls fetchSettings on mount', () => {
      render(<GoalProgressWidget currentAnnualDividend={180000} />);
      expect(mockFetchSettings).toHaveBeenCalled();
    });
  });
});
