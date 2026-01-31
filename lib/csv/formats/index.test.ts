import { describe, it, expect } from 'vitest';
import { getMapper, getExpectedHeaders } from './index';
import { GENERIC_HEADERS, mapToHolding } from './generic';

describe('formats registry', () => {
  describe('getMapper', () => {
    it('genericフォーマットでマッパー関数を返す', () => {
      const mapper = getMapper('generic');
      expect(mapper).toBe(mapToHolding);
    });

    it('sbiフォーマットでエラーをスローする', () => {
      expect(() => getMapper('sbi')).toThrow("フォーマット 'sbi' は未実装です。");
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

    it('sbiフォーマットでエラーをスローする', () => {
      expect(() => getExpectedHeaders('sbi')).toThrow("フォーマット 'sbi' は未実装です。");
    });

    it('rakutenフォーマットでエラーをスローする', () => {
      expect(() => getExpectedHeaders('rakuten')).toThrow("フォーマット 'rakuten' は未実装です。");
    });
  });
});
