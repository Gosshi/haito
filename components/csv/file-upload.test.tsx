/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FileUpload } from './file-upload';

describe('FileUpload', () => {
  describe('5.2 FileUploadコンポーネントにエンコーディング処理を統合する', () => {
    it('onFileLoadにUTF-8変換済み文字列を渡す', async () => {
      const onFileLoad = vi.fn();
      const onFormatDetected = vi.fn();

      render(
        <FileUpload
          onFileLoad={onFileLoad}
          onFormatDetected={onFormatDetected}
        />
      );

      // テストファイル内容（UTF-8）
      const csvContent = '銘柄コード,銘柄名,保有株数\n8306,三菱UFJ,100';
      const encoder = new TextEncoder();
      const bytes = encoder.encode(csvContent);

      const file = new File([bytes], 'test.csv', { type: 'text/csv' });

      const input = screen.getByRole('button', { name: 'ファイルを選択' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
        // FileReaderの非同期処理を待つ
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(onFileLoad).toHaveBeenCalledWith(csvContent);
      });
    });

    it('onFormatDetectedにフォーマット検出結果を渡す', async () => {
      const onFileLoad = vi.fn();
      const onFormatDetected = vi.fn();

      render(
        <FileUpload
          onFileLoad={onFileLoad}
          onFormatDetected={onFormatDetected}
        />
      );

      // 汎用フォーマットのCSV
      const csvContent = '銘柄コード,銘柄名,保有株数\n8306,三菱UFJ,100';
      const encoder = new TextEncoder();
      const bytes = encoder.encode(csvContent);

      const file = new File([bytes], 'test.csv', { type: 'text/csv' });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(onFormatDetected).toHaveBeenCalledWith('generic');
      });
    });

    it('SBI証券CSVの場合はsbiフォーマットを検出する', async () => {
      const onFileLoad = vi.fn();
      const onFormatDetected = vi.fn();

      render(
        <FileUpload
          onFileLoad={onFileLoad}
          onFormatDetected={onFormatDetected}
        />
      );

      // SBI証券フォーマットのCSV
      const csvContent = '銘柄（コード）,取得日,保有数,取得単価\n9104 商船三井,2024/01/01,100,1500';
      const encoder = new TextEncoder();
      const bytes = encoder.encode(csvContent);

      const file = new File([bytes], 'test.csv', { type: 'text/csv' });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(onFormatDetected).toHaveBeenCalledWith('sbi');
      });
    });

    it('対応フォーマット表示にSBI証券が含まれる', () => {
      const onFileLoad = vi.fn();

      render(<FileUpload onFileLoad={onFileLoad} />);

      expect(screen.getByText(/SBI証券/)).toBeInTheDocument();
    });

    it('onFormatDetectedがundefinedでもエラーにならない', async () => {
      const onFileLoad = vi.fn();

      render(<FileUpload onFileLoad={onFileLoad} />);

      const csvContent = '銘柄コード,銘柄名,保有株数\n8306,三菱UFJ,100';
      const encoder = new TextEncoder();
      const bytes = encoder.encode(csvContent);

      const file = new File([bytes], 'test.csv', { type: 'text/csv' });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(onFileLoad).toHaveBeenCalled();
      });
    });
  });
});
