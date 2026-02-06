export type PaywallCopy = {
  title: string;
  description: string;
  caution: string;
  ctaLabel: string;
};

export type PaywallCopyPolicy = {
  banned_phrases: readonly string[];
  preferred_terms: readonly ['試算', '前提条件'];
};

export type PaywallPlanValueItem = {
  feature: 'reinvest_rate' | 'account_type' | 'stress_test';
  label: string;
  freeValue: string;
  proValue: string;
};

export type PaywallPrice = {
  monthly_jpy: number;
  yearly_jpy: number;
};

export const PAYWALL_LOCK_COPY: PaywallCopy = {
  title: 'Proで利用できます',
  description:
    'より現実に近い試算（再投資率・税区分の調整）や、想定外（減配）の影響確認ができます。',
  caution: '入力前提に基づく試算であり、投資助言ではありません。',
  ctaLabel: 'プランの違いを見る',
};

export const PAYWALL_COPY_POLICY: PaywallCopyPolicy = {
  banned_phrases: ['おすすめ銘柄', '買うべき', '必ず儲かる'],
  preferred_terms: ['試算', '前提条件'],
};

export const PAYWALL_PLAN_VALUE_ITEMS: readonly PaywallPlanValueItem[] = [
  {
    feature: 'reinvest_rate',
    label: '再投資率調整',
    freeValue: '100%固定',
    proValue: '0.0〜1.0で調整',
  },
  {
    feature: 'account_type',
    label: '税区分切替',
    freeValue: 'NISA固定',
    proValue: 'NISA/課税を切替',
  },
  {
    feature: 'stress_test',
    label: 'ストレステスト',
    freeValue: '利用不可',
    proValue: '想定外（減配）の影響を確認',
  },
];

export const PAYWALL_PRICE: PaywallPrice = {
  monthly_jpy: 980,
  yearly_jpy: 9800,
};

export const containsBannedPaywallPhrase = (text: string): boolean =>
  PAYWALL_COPY_POLICY.banned_phrases.some((phrase) => text.includes(phrase));
