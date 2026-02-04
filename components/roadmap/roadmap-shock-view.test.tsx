/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RoadmapShockView } from './roadmap-shock-view';

const { mockGetFeatureAccess } = vi.hoisted(() => ({
  mockGetFeatureAccess: vi.fn(),
}));

vi.mock('../../lib/access/feature-access', () => ({
  getFeatureAccess: mockGetFeatureAccess,
}));

vi.mock('./roadmap-shock-form', () => ({
  RoadmapShockForm: () => <div data-testid="roadmap-shock-form" />,
}));

vi.mock('./roadmap-shock-summary', () => ({
  RoadmapShockSummary: () => <div data-testid="roadmap-shock-summary" />,
}));

vi.mock('./roadmap-shock-chart', () => ({
  RoadmapShockChart: () => <div data-testid="roadmap-shock-chart" />,
}));

describe('RoadmapShockView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('見出しと説明文を表示する', () => {
    mockGetFeatureAccess.mockResolvedValue({ stress_test: false });

    render(<RoadmapShockView />);

    expect(
      screen.getByText('想定外が起きた場合のロードマップ')
    ).toBeInTheDocument();
    expect(
      screen.getByText('一時的な減配が起きた場合の影響を確認できます。')
    ).toBeInTheDocument();
  });

  it('無料ユーザーの場合はロック表示を行う', async () => {
    mockGetFeatureAccess.mockResolvedValue({ stress_test: false });

    render(<RoadmapShockView />);

    expect(
      await screen.findByText('ストレステストは未実行です。')
    ).toBeInTheDocument();
    expect(
      screen.getByText('有料プランで利用できます。')
    ).toBeInTheDocument();
  });

  it('有料ユーザーの場合はフォームと結果を表示する', async () => {
    mockGetFeatureAccess.mockResolvedValue({ stress_test: true });

    render(<RoadmapShockView />);

    expect(await screen.findByTestId('roadmap-shock-form')).toBeInTheDocument();
    expect(screen.getByTestId('roadmap-shock-summary')).toBeInTheDocument();
    expect(screen.getByTestId('roadmap-shock-chart')).toBeInTheDocument();
  });
});
