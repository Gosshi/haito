/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PremiumLockBanner } from './premium-lock-banner';

describe('PremiumLockBanner', () => {
  it('ロック文言と導線を表示する', () => {
    render(<PremiumLockBanner feature="stress_test" />);

    expect(
      screen.getByText('この機能は有料プランで利用できます。')
    ).toBeInTheDocument();
    expect(screen.getByText('有料')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: '有料プランを見る' });
    expect(link).toHaveAttribute('href', '/billing');
  });
});
