import { describe, it, expect } from 'vitest';

import {
  FEATURE_CATALOG,
  FEATURE_KEYS,
  getFeatureLabel,
  isPremiumFeature,
} from './feature-catalog';

describe('feature-catalog', () => {
  it('有料対象の機能カタログを持つ', () => {
    expect(FEATURE_CATALOG.stress_test.premium).toBe(true);
    expect(FEATURE_CATALOG.anxiety_relief.premium).toBe(true);
  });

  it('機能キー一覧を提供する', () => {
    expect(FEATURE_KEYS).toHaveLength(2);
    expect(FEATURE_KEYS).toEqual(
      expect.arrayContaining(['stress_test', 'anxiety_relief'])
    );
  });

  it('有料判定と表示ラベルを取得できる', () => {
    expect(isPremiumFeature('stress_test')).toBe(true);
    expect(getFeatureLabel('anxiety_relief')).toBe('不安を減らす機能');
  });
});
