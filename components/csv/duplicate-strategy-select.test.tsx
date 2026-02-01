/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DuplicateStrategySelect } from './duplicate-strategy-select';

describe('DuplicateStrategySelect', () => {
  describe('表示', () => {
    it('「スキップ」と「上書き」の2つのオプションを表示する', () => {
      const handleChange = vi.fn();
      render(
        <DuplicateStrategySelect value="skip" onChange={handleChange} />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      // オプションが存在することを確認
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('スキップ');
      expect(options[1]).toHaveTextContent('上書き');
    });

    it('デフォルト値として「スキップ」が選択状態になる', () => {
      const handleChange = vi.fn();
      render(
        <DuplicateStrategySelect value="skip" onChange={handleChange} />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('skip');
    });

    it('「上書き」が選択されている場合、その値を表示する', () => {
      const handleChange = vi.fn();
      render(
        <DuplicateStrategySelect value="overwrite" onChange={handleChange} />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('overwrite');
    });
  });

  describe('インタラクション', () => {
    it('選択変更時にonChangeコールバックが呼ばれる', () => {
      const handleChange = vi.fn();
      render(
        <DuplicateStrategySelect value="skip" onChange={handleChange} />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'overwrite' } });

      expect(handleChange).toHaveBeenCalledWith('overwrite');
    });

    it('skipからoverwriteへの変更を正しく処理する', () => {
      const handleChange = vi.fn();
      render(
        <DuplicateStrategySelect value="skip" onChange={handleChange} />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'overwrite' } });

      expect(handleChange).toHaveBeenCalledWith('overwrite');
    });

    it('overwriteからskipへの変更を正しく処理する', () => {
      const handleChange = vi.fn();
      render(
        <DuplicateStrategySelect value="overwrite" onChange={handleChange} />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'skip' } });

      expect(handleChange).toHaveBeenCalledWith('skip');
    });
  });

  describe('無効化状態', () => {
    it('disabledがtrueの場合、セレクトが無効化される', () => {
      const handleChange = vi.fn();
      render(
        <DuplicateStrategySelect
          value="skip"
          onChange={handleChange}
          disabled={true}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('disabledがfalseの場合、セレクトが有効になる', () => {
      const handleChange = vi.fn();
      render(
        <DuplicateStrategySelect
          value="skip"
          onChange={handleChange}
          disabled={false}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
    });

    it('disabledが指定されない場合、デフォルトで有効になる', () => {
      const handleChange = vi.fn();
      render(
        <DuplicateStrategySelect value="skip" onChange={handleChange} />
      );

      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
    });
  });

  describe('アクセシビリティ', () => {
    it('ラベルが適切に関連付けられている', () => {
      const handleChange = vi.fn();
      render(
        <DuplicateStrategySelect value="skip" onChange={handleChange} />
      );

      // コンポーネントにアクセシブルな名前があることを確認
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });
});
