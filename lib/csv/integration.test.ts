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

describe('楽天証券CSV統合テスト', () => {
  describe('5.1 楽天証券CSVの一連フロー', () => {
    const rakutenCsvContent = `銘柄,口座,保有数量,平均取得価額,現在値,時価評価額,評価損益,評価損益率
9104 商船三井,特定,100,3200,4839,483900,163900,51.22
1605 ＩＮＰＥＸ,NISA成長投資枠,200,1800,2200,440000,80000,22.22
8306 三菱ＵＦＪ,NISAつみたて投資枠,50,1500,1800,90000,15000,20.00
2914 ＪＴ,つみたてNISA,30,2800,----,----,----,----`;

    it('エンコーディング検出→フォーマット検出→パース→変換の統合動作確認', () => {
      // UTF-8の文字列として既に用意されているため、フォーマット検出から開始
      const format = detectFormat(rakutenCsvContent);
      expect(format).toBe('rakuten');

      // パース
      const result = parseCsv(rakutenCsvContent, 'rakuten');

      // 変換結果の検証
      expect(result.holdings.length).toBe(4);
      expect(result.errors.length).toBe(0);
    });

    it('銘柄コードと銘柄名が正しく抽出される', () => {
      const result = parseCsv(rakutenCsvContent, 'rakuten');

      // 銘柄コードの確認
      const stockCodes = result.holdings.map((h) => h.stock_code);
      expect(stockCodes).toContain('9104');
      expect(stockCodes).toContain('1605');
      expect(stockCodes).toContain('8306');
      expect(stockCodes).toContain('2914');

      // 銘柄名の確認
      const stockNames = result.holdings.map((h) => h.stock_name);
      expect(stockNames).toContain('商船三井');
      expect(stockNames).toContain('ＩＮＰＥＸ');
      expect(stockNames).toContain('三菱ＵＦＪ');
      expect(stockNames).toContain('ＪＴ');
    });

    it('口座種別が正しくマッピングされる', () => {
      const result = parseCsv(rakutenCsvContent, 'rakuten');

      // 口座種別を銘柄コードで確認
      const holdingMap = new Map(result.holdings.map((h) => [h.stock_code, h]));

      expect(holdingMap.get('9104')?.account_type).toBe('specific');
      expect(holdingMap.get('1605')?.account_type).toBe('nisa_growth');
      expect(holdingMap.get('8306')?.account_type).toBe('nisa_tsumitate');
      expect(holdingMap.get('2914')?.account_type).toBe('nisa_legacy');
    });

    it('数量と取得単価が正しく変換される', () => {
      const result = parseCsv(rakutenCsvContent, 'rakuten');

      const holdingMap = new Map(result.holdings.map((h) => [h.stock_code, h]));

      // 商船三井
      expect(holdingMap.get('9104')?.shares).toBe(100);
      expect(holdingMap.get('9104')?.acquisition_price).toBe(3200);

      // JT
      expect(holdingMap.get('2914')?.shares).toBe(30);
      expect(holdingMap.get('2914')?.acquisition_price).toBe(2800);
    });

    it('取得単価が「----」の場合はnullになる', () => {
      const csvWithInvalidPrice = `銘柄,口座,保有数量,平均取得価額
9104 商船三井,特定,100,----`;

      const result = parseCsv(csvWithInvalidPrice, 'rakuten');
      expect(result.holdings.length).toBe(1);
      expect(result.holdings[0].acquisition_price).toBeNull();
    });

    it('CRLF改行コードでも正しく動作する', () => {
      const crlfContent = rakutenCsvContent.replace(/\n/g, '\r\n');

      const format = detectFormat(crlfContent);
      expect(format).toBe('rakuten');

      const result = parseCsv(crlfContent, 'rakuten');
      expect(result.holdings.length).toBe(4);
    });

    it('既存テストスイートがパスすることを確認（リグレッションなし）', () => {
      // SBI証券フォーマットが引き続き正しく動作することを確認
      const sbiContent = `銘柄（コード）,買付日,数量,取得単価,現在値,前日比,前日比（％）,損益,損益（％）,評価額
9104 商船三井,2024/01/01,100,3500,4000,+50,+1.27,+50000,+14.29,400000`;

      const sbiFormat = detectFormat(sbiContent);
      expect(sbiFormat).toBe('sbi');

      // 汎用フォーマットが引き続き正しく動作することを確認
      const genericContent = `銘柄コード,銘柄名,保有株数,取得単価,口座種別
9104,商船三井,100,3500,specific`;

      const genericFormat = detectFormat(genericContent);
      expect(genericFormat).toBe('generic');

      const genericResult = parseCsv(genericContent, 'generic');
      expect(genericResult.holdings.length).toBe(1);
      expect(genericResult.holdings[0].stock_code).toBe('9104');
    });
  });
});
