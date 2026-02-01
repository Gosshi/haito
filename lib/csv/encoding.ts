/** エンコーディング種別 */
export type Encoding = 'utf-8' | 'shift-jis';

/**
 * UTF-8として有効なバイトシーケンスかをチェックする
 * @param bytes - バイト配列
 * @returns 有効なUTF-8ならtrue
 */
function isValidUtf8(bytes: Uint8Array): boolean {
  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i];

    if (byte <= 0x7f) {
      // ASCII文字 (0x00-0x7F)
      i++;
    } else if ((byte & 0xe0) === 0xc0) {
      // 2バイト文字 (110xxxxx 10xxxxxx)
      if (i + 1 >= bytes.length || (bytes[i + 1] & 0xc0) !== 0x80) {
        return false;
      }
      i += 2;
    } else if ((byte & 0xf0) === 0xe0) {
      // 3バイト文字 (1110xxxx 10xxxxxx 10xxxxxx)
      if (
        i + 2 >= bytes.length ||
        (bytes[i + 1] & 0xc0) !== 0x80 ||
        (bytes[i + 2] & 0xc0) !== 0x80
      ) {
        return false;
      }
      i += 3;
    } else if ((byte & 0xf8) === 0xf0) {
      // 4バイト文字 (11110xxx 10xxxxxx 10xxxxxx 10xxxxxx)
      if (
        i + 3 >= bytes.length ||
        (bytes[i + 1] & 0xc0) !== 0x80 ||
        (bytes[i + 2] & 0xc0) !== 0x80 ||
        (bytes[i + 3] & 0xc0) !== 0x80
      ) {
        return false;
      }
      i += 4;
    } else {
      // 不正なUTF-8バイト
      return false;
    }
  }
  return true;
}

/**
 * エンコーディングを検出
 * @param buffer - ファイル内容のArrayBuffer
 * @returns 検出されたエンコーディング
 */
export function detectEncoding(buffer: ArrayBuffer): Encoding {
  const bytes = new Uint8Array(buffer);

  // UTF-8 BOMの確認 (EF BB BF)
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }

  // UTF-8として有効かチェック
  if (isValidUtf8(bytes)) {
    return 'utf-8';
  }

  // UTF-8として無効な場合はShift-JISと判定
  return 'shift-jis';
}

/**
 * ArrayBufferから文字列にデコード
 * @param buffer - ファイル内容のArrayBuffer
 * @returns UTF-8文字列
 */
export function decodeToString(buffer: ArrayBuffer): string {
  const encoding = detectEncoding(buffer);

  if (encoding === 'utf-8') {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
  }

  // Shift-JIS → UTF-8変換
  const decoder = new TextDecoder('shift-jis');
  return decoder.decode(buffer);
}
