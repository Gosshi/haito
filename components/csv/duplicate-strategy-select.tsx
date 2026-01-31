import type { DuplicateStrategy } from '../../lib/api/holdings-bulk';
import { Select, SelectItem } from '../ui/select';

export interface DuplicateStrategySelectProps {
  value: DuplicateStrategy;
  onChange: (value: DuplicateStrategy) => void;
  disabled?: boolean;
}

export function DuplicateStrategySelect({
  value,
  onChange,
  disabled = false,
}: DuplicateStrategySelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as DuplicateStrategy);
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      aria-label="重複時の処理方法"
    >
      <SelectItem value="skip">スキップ</SelectItem>
      <SelectItem value="overwrite">上書き</SelectItem>
    </Select>
  );
}
