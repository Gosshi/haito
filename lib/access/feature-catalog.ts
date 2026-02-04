export type PlanTier = 'free' | 'premium';

export type FeatureKey = 'stress_test' | 'anxiety_relief';

export type FeatureCatalogEntry = {
  premium: boolean;
  label: string;
};

export type FeatureCatalog = Record<FeatureKey, FeatureCatalogEntry>;

export const FEATURE_CATALOG: FeatureCatalog = {
  stress_test: {
    premium: true,
    label: 'ストレステスト',
  },
  anxiety_relief: {
    premium: true,
    label: '不安を減らす機能',
  },
};

export const FEATURE_KEYS = Object.keys(FEATURE_CATALOG) as FeatureKey[];

export const isPremiumFeature = (feature: FeatureKey): boolean => {
  return FEATURE_CATALOG[feature].premium;
};

export const getFeatureLabel = (feature: FeatureKey): string => {
  return FEATURE_CATALOG[feature].label;
};
