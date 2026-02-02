/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Progress } from './progress';

describe('Progress', () => {
  it('renders with 0% value', () => {
    render(<Progress value={0} data-testid="progress" />);
    const progressBar = screen.getByTestId('progress');
    expect(progressBar).toBeDefined();
  });

  it('renders with 50% value', () => {
    render(<Progress value={50} data-testid="progress" />);
    const progressBar = screen.getByTestId('progress');
    expect(progressBar).toBeDefined();
  });

  it('renders with 100% value', () => {
    render(<Progress value={100} data-testid="progress" />);
    const progressBar = screen.getByTestId('progress');
    expect(progressBar).toBeDefined();
  });

  it('clamps value at 100% when value exceeds 100', () => {
    render(<Progress value={150} data-testid="progress" />);
    const progressBar = screen.getByTestId('progress');
    expect(progressBar).toBeDefined();
    const indicator = progressBar.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toBeDefined();
    // value=150 is clamped to 100, so translateX is -0% (100-100=0)
    expect(indicator?.getAttribute('style')).toContain('translateX(-0%)');
  });

  it('clamps value at 0% when value is negative', () => {
    render(<Progress value={-10} data-testid="progress" />);
    const progressBar = screen.getByTestId('progress');
    const indicator = progressBar.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toBeDefined();
    expect(indicator?.getAttribute('style')).toContain('0%');
  });

  it('applies custom className', () => {
    render(<Progress value={50} className="custom-class" data-testid="progress" />);
    const progressBar = screen.getByTestId('progress');
    expect(progressBar.className).toContain('custom-class');
  });
});
