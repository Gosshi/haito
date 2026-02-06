import { describe, expect, it } from 'vitest';

import {
  PAYWALL_COPY_POLICY,
  PAYWALL_LOCK_COPY,
  containsBannedPaywallPhrase,
} from './copy';

describe('PAYWALL_LOCK_COPY', () => {
  it('固定ロックコピーを返す', () => {
    expect(PAYWALL_LOCK_COPY.title).toBe('Proで利用できます');
    expect(PAYWALL_LOCK_COPY.description).toBe(
      'より現実に近い試算（再投資率・税区分の調整）や、想定外（減配）の影響確認ができます。'
    );
    expect(PAYWALL_LOCK_COPY.caution).toBe(
      '入力前提に基づく試算であり、投資助言ではありません。'
    );
    expect(PAYWALL_LOCK_COPY.ctaLabel).toBe('プランの違いを見る');
  });

  it('禁止語と推奨語ポリシーを持つ', () => {
    expect(PAYWALL_COPY_POLICY.banned_phrases).toEqual(
      expect.arrayContaining(['おすすめ銘柄', '買うべき', '必ず儲かる'])
    );
    expect(PAYWALL_COPY_POLICY.preferred_terms).toEqual(['試算', '前提条件']);
  });

  it('禁止語を含む文言を検知できる', () => {
    expect(containsBannedPaywallPhrase('おすすめ銘柄です')).toBe(true);
    expect(containsBannedPaywallPhrase(PAYWALL_LOCK_COPY.description)).toBe(false);
    expect(containsBannedPaywallPhrase(PAYWALL_LOCK_COPY.caution)).toBe(false);
  });
});
