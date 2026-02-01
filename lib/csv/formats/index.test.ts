import { describe, it, expect } from 'vitest';
import { getMapper, getExpectedHeaders } from './index';
import { GENERIC_HEADERS, mapToHolding } from './generic';
import { SBI_HEADERS, mapToHolding as sbiMapToHolding } from './sbi';

describe('formats registry', () => {
  describe('getMapper', () => {
    it('genericフォーマットでマッパー関数を返す', () => {
      const mapper = getMapper('generic');
      expect(mapper).toBe(mapToHolding);
    });

    it('sbiフォーマットでマッパー関数を返す', () => {
      const mapper = getMapper('sbi');
      expect(mapper).toBe(sbiMapToHolding);
    });

    it('rakutenフォーマットでエラーをスローする', () => {
      expect(() => getMapper('rakuten')).toThrow("フォーマット 'rakuten' は未実装です。");
    });
  });

  describe('getExpectedHeaders', () => {
    it('genericフォーマットで期待ヘッダーを返す', () => {
      const headers = getExpectedHeaders('generic');
      expect(headers).toBe(GENERIC_HEADERS);
    });

    it('sbiフォーマットで期待ヘッダーを返す', () => {
      const headers = getExpectedHeaders('sbi');
      expect(headers).toBe(SBI_HEADERS);
    });

    it('rakutenフォーマットでエラーをスローする', () => {
      expect(() => getExpectedHeaders('rakuten')).toThrow("フォーマット 'rakuten' は未実装です。");
    });
  });
});
