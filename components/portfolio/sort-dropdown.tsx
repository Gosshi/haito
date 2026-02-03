import type { ChangeEvent } from 'react';

import { Select, SelectItem } from '../ui/select';

export type SortOption =
  | 'yield_desc'
  | 'yield_asc'
  | 'annual_dividend_desc'
  | 'annual_dividend_asc'
  | 'stock_code_asc';

export type SortDropdownProps = {
  value: SortOption;
  onChange: (next: SortOption) => void;
  showStatus: boolean;
};

const sortOptionLabels: Record<SortOption, string> = {
  yield_desc: '配当利回り（高い順）',
  yield_asc: '配当利回り（低い順）',
  annual_dividend_desc: '年間配当額（高い順）',
  annual_dividend_asc: '年間配当額（低い順）',
  stock_code_asc: '銘柄コード順',
};

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'yield_desc', label: sortOptionLabels.yield_desc },
  { value: 'yield_asc', label: sortOptionLabels.yield_asc },
  { value: 'annual_dividend_desc', label: sortOptionLabels.annual_dividend_desc },
  { value: 'annual_dividend_asc', label: sortOptionLabels.annual_dividend_asc },
  { value: 'stock_code_asc', label: sortOptionLabels.stock_code_asc },
];

export function SortDropdown({ value, onChange, showStatus }: SortDropdownProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as SortOption);
  };

  return (
    <div className="space-y-1">
      <label htmlFor="portfolio-sort" className="text-sm text-muted-foreground">
        並べ替え
      </label>
      <Select id="portfolio-sort" value={value} onChange={handleChange}>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </Select>
      {showStatus && (
        <p className="text-xs text-muted-foreground">
          現在の並び順: {sortOptionLabels[value]}
        </p>
      )}
    </div>
  );
}
