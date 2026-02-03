/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortDropdown } from './sort-dropdown';

const optionLabels = [
  '配当利回り（高い順）',
  '配当利回り（低い順）',
  '年間配当額（高い順）',
  '年間配当額（低い順）',
  '銘柄コード順',
];

describe('SortDropdown', () => {
  it('5種類のソート項目を表示する', () => {
    const handleChange = vi.fn();
    render(
      <SortDropdown value="yield_desc" onChange={handleChange} showStatus={false} />
    );

    const select = screen.getByLabelText('並べ替え');
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5);
    optionLabels.forEach((label, index) => {
      expect(options[index]).toHaveTextContent(label);
    });
  });

  it('指定された値を選択状態として表示する', () => {
    const handleChange = vi.fn();
    render(
      <SortDropdown value="annual_dividend_asc" onChange={handleChange} showStatus={false} />
    );

    const select = screen.getByLabelText('並べ替え') as HTMLSelectElement;
    expect(select.value).toBe('annual_dividend_asc');
  });

  it('showStatusがtrueの場合に現在のソート状態を表示する', () => {
    const handleChange = vi.fn();
    render(
      <SortDropdown value="yield_desc" onChange={handleChange} showStatus={true} />
    );

    expect(screen.getByText('現在の並び順: 配当利回り（高い順）')).toBeInTheDocument();
  });

  it('選択変更時にonChangeを呼び出す', () => {
    const handleChange = vi.fn();
    render(
      <SortDropdown value="yield_desc" onChange={handleChange} showStatus={false} />
    );

    const select = screen.getByLabelText('並べ替え');
    fireEvent.change(select, { target: { value: 'yield_asc' } });

    expect(handleChange).toHaveBeenCalledWith('yield_asc');
  });
});
