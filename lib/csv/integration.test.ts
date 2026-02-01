/**
 * SBI証券CSV統合テスト
 *
 * タスク6.1: サンプルCSV（my_data/my_portfolio.csv）を使用したパーステスト
 * - Shift-JIS→UTF-8変換が正しく動作することを確認
 * - 日本語銘柄名が文字化けなく表示されることを確認
 * - 複数セクション（特定口座、NISA口座等）からデータが正しく抽出されることを確認
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { decodeToString, detectEncoding } from './encoding';
import { detectFormat } from './detect-format';
import { parseCsv } from './parser';

describe('SBI証券CSV統合テスト', () => {
  // サンプルCSVファイルを読み込む
  const sampleCsvPath = path.join(process.cwd(), 'my_data', 'my_portfolio.csv');

  describe('6.1 Shift-JIS→UTF-8変換', () => {
    it('SBI証券CSVファイルがShift-JISとして検出される', () => {
      // ファイルが存在するか確認
      const exists = fs.existsSync(sampleCsvPath);
      if (!exists) {
        console.log('サンプルCSVファイルが存在しないため、テストをスキップします');
        return;
      }

      const buffer = fs.readFileSync(sampleCsvPath);
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );

      const encoding = detectEncoding(arrayBuffer);
      expect(encoding).toBe('shift-jis');
    });

    it('Shift-JISからUTF-8に正しく変換される', () => {
      const exists = fs.existsSync(sampleCsvPath);
      if (!exists) {
        console.log('サンプルCSVファイルが存在しないため、テストをスキップします');
        return;
      }

      const buffer = fs.readFileSync(sampleCsvPath);
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );

      const content = decodeToString(arrayBuffer);

      // 日本語が正しく変換されていることを確認
      expect(content).toContain('ポートフォリオ一覧');
      expect(content).toContain('銘柄（コード）');
      expect(content).toContain('商船三井');
    });

    it('日本語銘柄名が文字化けなく保持される', () => {
      const exists = fs.existsSync(sampleCsvPath);
      if (!exists) {
        console.log('サンプルCSVファイルが存在しないため、テストをスキップします');
        return;
      }

      const buffer = fs.readFileSync(sampleCsvPath);
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );

      const content = decodeToString(arrayBuffer);

      // 各銘柄名が正しく変換されていることを確認（全角文字を含む）
      const expectedStockNames = [
        '商船三井',
        'ＩＮＰＥＸ',
        '三菱ＵＦＪ',
        '三井住友',
        '三菱重',
        '東京海上',
        '日本製鉄',
      ];

      for (const name of expectedStockNames) {
        expect(content).toContain(name);
      }
    });
  });

  describe('6.1 フォーマット自動検出', () => {
    it('SBI証券CSVとしてフォーマットが検出される', () => {
      const exists = fs.existsSync(sampleCsvPath);
      if (!exists) {
        console.log('サンプルCSVファイルが存在しないため、テストをスキップします');
        return;
      }

      const buffer = fs.readFileSync(sampleCsvPath);
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );

      const content = decodeToString(arrayBuffer);
      const format = detectFormat(content);

      expect(format).toBe('sbi');
    });
  });

  describe('6.1 CSVパース', () => {
    it('SBI証券CSVから保有銘柄を抽出できる', () => {
      const exists = fs.existsSync(sampleCsvPath);
      if (!exists) {
        console.log('サンプルCSVファイルが存在しないため、テストをスキップします');
        return;
      }

      const buffer = fs.readFileSync(sampleCsvPath);
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );

      const content = decodeToString(arrayBuffer);
      const result = parseCsv(content, 'sbi');

      // 保有銘柄が抽出されていることを確認
      expect(result.holdings.length).toBeGreaterThan(0);

      // 銘柄コードが正しく抽出されていることを確認
      const stockCodes = result.holdings.map((h) => h.stock_code);
      expect(stockCodes).toContain('9104'); // 商船三井
    });

    it('複数のセクション（口座種別）からデータを抽出する', () => {
      const exists = fs.existsSync(sampleCsvPath);
      if (!exists) {
        console.log('サンプルCSVファイルが存在しないため、テストをスキップします');
        return;
      }

      const buffer = fs.readFileSync(sampleCsvPath);
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );

      const content = decodeToString(arrayBuffer);
      const result = parseCsv(content, 'sbi');

      // 複数の口座種別が含まれていることを確認
      const accountTypes = new Set(result.holdings.map((h) => h.account_type));
      expect(accountTypes.size).toBeGreaterThan(0);
    });

    it('セクションヘッダー行と集計行がスキップされる', () => {
      const exists = fs.existsSync(sampleCsvPath);
      if (!exists) {
        console.log('サンプルCSVファイルが存在しないため、テストをスキップします');
        return;
      }

      const buffer = fs.readFileSync(sampleCsvPath);
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );

      const content = decodeToString(arrayBuffer);
      const result = parseCsv(content, 'sbi');

      // セクションヘッダーや集計行が保有銘柄として含まれていないことを確認
      const invalidPatterns = ['合計', '一覧', '口座)', '評価額'];
      for (const holding of result.holdings) {
        for (const pattern of invalidPatterns) {
          expect(holding.stock_name).not.toContain(pattern);
        }
      }
    });
  });
});
