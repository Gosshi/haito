import { describe, it, expect } from 'vitest';
import { detectEncoding, decodeToString } from './encoding';

describe('encoding', () => {
  describe('detectEncoding', () => {
    it('UTF-8 BOM付きのデータをUTF-8として検出する', () => {
      // UTF-8 BOM: 0xEF, 0xBB, 0xBF
      const buffer = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x65, 0x6c, 0x6c, 0x6f]).buffer;

      const result = detectEncoding(buffer);

      expect(result).toBe('utf-8');
    });

    it('UTF-8 BOMがないデータをShift-JISとして検出する', () => {
      // Shift-JIS "あいう" (0x82A0, 0x82A2, 0x82A4)
      const buffer = new Uint8Array([0x82, 0xa0, 0x82, 0xa2, 0x82, 0xa4]).buffer;

      const result = detectEncoding(buffer);

      expect(result).toBe('shift-jis');
    });

    it('ASCII文字のみのデータをUTF-8として検出する', () => {
      // ASCII "Hello"
      const buffer = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]).buffer;

      const result = detectEncoding(buffer);

      expect(result).toBe('utf-8');
    });

    it('有効なUTF-8マルチバイト文字をUTF-8として検出する', () => {
      // UTF-8 "あ" (0xE3, 0x81, 0x82)
      const encoder = new TextEncoder();
      const buffer = encoder.encode('あいう').buffer;

      const result = detectEncoding(buffer);

      expect(result).toBe('utf-8');
    });
  });

  describe('decodeToString', () => {
    it('UTF-8 BOM付きデータを正しくデコードする', () => {
      const encoder = new TextEncoder();
      const content = '銘柄コード,銘柄名';
      const bomArray = new Uint8Array([0xef, 0xbb, 0xbf]);
      const contentArray = encoder.encode(content);
      const combined = new Uint8Array(bomArray.length + contentArray.length);
      combined.set(bomArray);
      combined.set(contentArray, bomArray.length);

      const result = decodeToString(combined.buffer);

      // BOMは含まれるが、パーサー側で除去される
      expect(result).toContain('銘柄コード');
      expect(result).toContain('銘柄名');
    });

    it('UTF-8データを正しくデコードする', () => {
      const encoder = new TextEncoder();
      const content = '7203,トヨタ自動車,100';
      const buffer = encoder.encode(content).buffer;

      const result = decodeToString(buffer);

      expect(result).toBe(content);
    });

    it('Shift-JISデータを正しくUTF-8に変換する', () => {
      // Shift-JIS "あいう" (0x82A0, 0x82A2, 0x82A4)
      const buffer = new Uint8Array([0x82, 0xa0, 0x82, 0xa2, 0x82, 0xa4]).buffer;

      const result = decodeToString(buffer);

      expect(result).toBe('あいう');
    });

    it('Shift-JISの日本語銘柄名を正しくデコードする', () => {
      // Shift-JIS "商船三井" を作成
      // 商=8FA4, 船=914D, 三=8E4F, 井=88E4 (正しいShift-JISエンコーディング)
      // 実際の正しいバイト列: 商=8FA4は間違い、正しくは商=8f a4ではなく8f a4ではなく
      // より単純なテストケースを使用
      // Shift-JIS "ABC" + 日本語テスト
      // "トヨタ" のShift-JISバイト: 0x83, 0x67, 0x83, 0x88, 0x83, 0x5E
      const sjisBuffer = new Uint8Array([0x83, 0x67, 0x83, 0x88, 0x83, 0x5e]).buffer;

      const result = decodeToString(sjisBuffer);

      expect(result).toBe('トヨタ');
    });

    it('日本語文字（漢字・ひらがな・カタカナ）を正しく保持する', () => {
      const encoder = new TextEncoder();
      const content = '銘柄コード,トヨタ自動車,特定/一般口座';
      const buffer = encoder.encode(content).buffer;

      const result = decodeToString(buffer);

      expect(result).toContain('銘柄コード');
      expect(result).toContain('トヨタ自動車');
      expect(result).toContain('特定/一般口座');
    });
  });
});
