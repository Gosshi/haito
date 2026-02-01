import { describe, it, expect } from 'vitest';
import { getMapper, getExpectedHeaders } from './index';
import { GENERIC_HEADERS, mapToHolding } from './generic';
import { SBI_HEADERS, mapToHolding as sbiMapToHolding } from './sbi';
import { RAKUTEN_HEADERS, mapToHolding as rakutenMapToHolding } from './rakuten';

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

    it('rakutenフォーマットでマッパー関数を返す', () => {
      const mapper = getMapper('rakuten');
      expect(mapper).toBe(rakutenMapToHolding);
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

    it('rakutenフォーマットで期待ヘッダーを返す', () => {
      const headers = getExpectedHeaders('rakuten');
      expect(headers).toBe(RAKUTEN_HEADERS);
    });
  });

  describe('既存フォーマットへの影響なし', () => {
    it('rakuten追加後もgenericは正常に動作する', () => {
      const genericMapper = getMapper('generic');
      const genericHeaders = getExpectedHeaders('generic');
      expect(genericMapper).toBeDefined();
      expect(genericHeaders).toContain('銘柄コード');
    });

    it('rakuten追加後もsbiは正常に動作する', () => {
      const sbiMapper = getMapper('sbi');
      const sbiHeaders = getExpectedHeaders('sbi');
      expect(sbiMapper).toBeDefined();
      expect(sbiHeaders).toContain('銘柄（コード）');
    });
  });
});
