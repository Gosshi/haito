/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { PremiumLockBanner } from './premium-lock-banner';

describe('PremiumLockBanner', () => {
  it('固定ロック文言を表示する', () => {
    render(<PremiumLockBanner feature="stress_test" />);

    expect(screen.getByText('Proで利用できます')).toBeInTheDocument();
    expect(
      screen.getByText(
        'より現実に近い試算（再投資率・税区分の調整）や、想定外（減配）の影響確認ができます。'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('入力前提に基づく試算であり、投資助言ではありません。')
    ).toBeInTheDocument();
  });

  it('導線からプラン説明を開いて閉じると元表示へ戻る', () => {
    render(<PremiumLockBanner feature="stress_test" />);

    fireEvent.click(screen.getByRole('button', { name: 'プランの違いを見る' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('FreeとProの違い')).toBeInTheDocument();
    expect(within(dialog).getByText('再投資率調整')).toBeInTheDocument();
    expect(within(dialog).getByText('税区分切替')).toBeInTheDocument();
    expect(within(dialog).getByText('ストレステスト')).toBeInTheDocument();
    expect(within(dialog).getByText('月額 980円')).toBeInTheDocument();
    expect(within(dialog).getByText('年額 9,800円')).toBeInTheDocument();
    expect(
      within(dialog).getByText('入力前提に基づく試算であり、投資助言ではありません。')
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: '閉じる' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Proで利用できます')).toBeInTheDocument();
  });
});
