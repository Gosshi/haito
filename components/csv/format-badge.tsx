import type { DetectedFormat } from '../../lib/csv/detect-format';

export interface FormatBadgeProps {
  format: DetectedFormat;
}

const FORMAT_DISPLAY: Record<DetectedFormat, {
  label: string;
  className: string;
}> = {
  sbi: {
    label: 'SBI証券フォーマットを検出しました',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  generic: {
    label: '汎用フォーマットを検出しました',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  rakuten: {
    label: '楽天証券フォーマットを検出しました',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  unknown: {
    label: 'フォーマットを検出できませんでした',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
};

export function FormatBadge({ format }: FormatBadgeProps) {
  const { label, className } = FORMAT_DISPLAY[format];

  return (
    <span
      className={[
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium',
        className,
      ].join(' ')}
    >
      {label}
    </span>
  );
}
