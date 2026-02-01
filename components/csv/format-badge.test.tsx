/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormatBadge } from './format-badge';

describe('FormatBadge', () => {
  describe('5.1 フォーマットバッジコンポーネントを実装する', () => {
    it('SBIフォーマットの場合「SBI証券フォーマットを検出しました」と表示する', () => {
      render(<FormatBadge format="sbi" />);
      expect(screen.getByText('SBI証券フォーマットを検出しました')).toBeInTheDocument();
    });

    it('汎用フォーマットの場合「汎用フォーマットを検出しました」と表示する', () => {
      render(<FormatBadge format="generic" />);
      expect(screen.getByText('汎用フォーマットを検出しました')).toBeInTheDocument();
    });

    it('unknownの場合「フォーマットを検出できませんでした」と警告表示する', () => {
      render(<FormatBadge format="unknown" />);
      expect(screen.getByText('フォーマットを検出できませんでした')).toBeInTheDocument();
    });

    it('楽天フォーマットの場合「楽天証券フォーマットを検出しました」と表示する', () => {
      render(<FormatBadge format="rakuten" />);
      expect(screen.getByText('楽天証券フォーマットを検出しました')).toBeInTheDocument();
    });

    it('SBIフォーマットはsuccessスタイルで表示される', () => {
      const { container } = render(<FormatBadge format="sbi" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-green');
    });

    it('汎用フォーマットはdefaultスタイルで表示される', () => {
      const { container } = render(<FormatBadge format="generic" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-gray');
    });

    it('unknownはwarningスタイルで表示される', () => {
      const { container } = render(<FormatBadge format="unknown" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-yellow');
    });
  });
});
