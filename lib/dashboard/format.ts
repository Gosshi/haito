const formatNumber = (value: number): string => value.toLocaleString('ja-JP');

export const formatCurrencyJPY = (value: number | null): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }

  const floored = Math.floor(value);
  return `¥${formatNumber(floored)}`;
};
