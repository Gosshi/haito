import { describe, it, expect } from 'vitest';
import type {
  DuplicateStrategy,
  BulkImportRequest,
  BulkImportResponse,
  BulkImportError,
  BulkImportResult,
  BulkImportSuccessResult,
  BulkImportFailureResult,
  BulkImportServiceError,
  BulkImportItemError,
  DuplicateCheckResult,
  DuplicateInfo,
  ProcessBatchItemResult,
  BatchOperationTracker,
} from './holdings-bulk';
import {
  checkDuplicates,
  processBatchItem,
  createBatchOperationTracker,
} from './holdings-bulk';
import type { Holding, NewHolding } from '../holdings/types';

describe('holdings-bulk types', () => {
  describe('DuplicateStrategy', () => {
    it('skip と overwrite の値を持つ', () => {
      const skip: DuplicateStrategy = 'skip';
      const overwrite: DuplicateStrategy = 'overwrite';

      expect(skip).toBe('skip');
      expect(overwrite).toBe('overwrite');
    });
  });

  describe('BulkImportRequest', () => {
    it('holdings配列とduplicateStrategyを持つ', () => {
      const request: BulkImportRequest = {
        holdings: [
          {
            stock_code: '7203',
            stock_name: 'トヨタ自動車',
            shares: 100,
            acquisition_price: 2500,
            account_type: 'specific',
          },
        ],
        duplicateStrategy: 'skip',
      };

      expect(request.holdings).toHaveLength(1);
      expect(request.duplicateStrategy).toBe('skip');
    });
  });

  describe('BulkImportResponse', () => {
    it('success, imported, skipped, errorsを持つ', () => {
      const response: BulkImportResponse = {
        success: true,
        imported: 5,
        skipped: 2,
        errors: [{ row: 3, reason: 'バリデーションエラー' }],
      };

      expect(response.success).toBe(true);
      expect(response.imported).toBe(5);
      expect(response.skipped).toBe(2);
      expect(response.errors).toHaveLength(1);
    });
  });

  describe('BulkImportError', () => {
    it('row と reason を持つ', () => {
      const error: BulkImportError = {
        row: 3,
        reason: 'エラーメッセージ',
      };

      expect(error.row).toBe(3);
      expect(error.reason).toBe('エラーメッセージ');
    });
  });

  describe('BulkImportServiceError', () => {
    it('type と message を持つ', () => {
      const error: BulkImportServiceError = {
        type: 'validation',
        message: 'バリデーションエラー',
      };

      expect(error.type).toBe('validation');
      expect(error.message).toBe('バリデーションエラー');
    });

    it('type は validation, database, unauthorized, unknown のいずれか', () => {
      const types: BulkImportServiceError['type'][] = [
        'validation',
        'database',
        'unauthorized',
        'unknown',
      ];

      types.forEach((type) => {
        const error: BulkImportServiceError = { type, message: 'test' };
        expect(error.type).toBe(type);
      });
    });
  });

  describe('BulkImportItemError', () => {
    it('row と reason を持つ', () => {
      const error: BulkImportItemError = {
        row: 5,
        reason: '株数が無効です',
      };

      expect(error.row).toBe(5);
      expect(error.reason).toBe('株数が無効です');
    });
  });

  describe('BulkImportSuccessResult', () => {
    it('ok: true と imported, skipped, errors を持つ', () => {
      const result: BulkImportSuccessResult = {
        ok: true,
        imported: 10,
        skipped: 2,
        errors: [],
      };

      expect(result.ok).toBe(true);
      expect(result.imported).toBe(10);
      expect(result.skipped).toBe(2);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('BulkImportFailureResult', () => {
    it('ok: false と error を持つ', () => {
      const result: BulkImportFailureResult = {
        ok: false,
        error: {
          type: 'unauthorized',
          message: '認証が必要です',
        },
      };

      expect(result.ok).toBe(false);
      expect(result.error.type).toBe('unauthorized');
    });
  });

  describe('BulkImportResult', () => {
    it('成功時は ok: true の型になる', () => {
      const result: BulkImportResult = {
        ok: true,
        imported: 5,
        skipped: 1,
        errors: [],
      };

      if (result.ok) {
        expect(result.imported).toBe(5);
        expect(result.skipped).toBe(1);
      }
    });

    it('失敗時は ok: false の型になる', () => {
      const result: BulkImportResult = {
        ok: false,
        error: {
          type: 'database',
          message: 'DB接続エラー',
        },
      };

      if (!result.ok) {
        expect(result.error.type).toBe('database');
      }
    });
  });

  describe('DuplicateCheckResult', () => {
    it('重複情報の配列を持つ', () => {
      const result: DuplicateCheckResult = {
        duplicates: [
          {
            rowNumber: 1,
            stockCode: '7203',
            accountType: 'specific',
            existingHoldingId: 'uuid-123',
          },
        ],
      };

      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].rowNumber).toBe(1);
    });
  });

  describe('DuplicateInfo', () => {
    it('rowNumber, stockCode, accountType, existingHoldingId を持つ', () => {
      const info: DuplicateInfo = {
        rowNumber: 2,
        stockCode: '9984',
        accountType: 'nisa_growth',
        existingHoldingId: 'uuid-456',
      };

      expect(info.rowNumber).toBe(2);
      expect(info.stockCode).toBe('9984');
      expect(info.accountType).toBe('nisa_growth');
      expect(info.existingHoldingId).toBe('uuid-456');
    });
  });
});

describe('checkDuplicates', () => {
  const createExistingHolding = (
    id: string,
    stockCode: string,
    accountType: Holding['account_type']
  ): Holding => ({
    id,
    user_id: 'user-123',
    stock_code: stockCode,
    stock_name: `銘柄${stockCode}`,
    shares: 100,
    acquisition_price: 1000,
    account_type: accountType,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  });

  describe('重複判定ロジック', () => {
    it('同一銘柄コード+同一口座種別の組み合わせを重複として検出する', () => {
      const existingHoldings: Holding[] = [
        createExistingHolding('id-1', '7203', 'specific'),
      ];

      const newHoldings: NewHolding[] = [
        {
          stock_code: '7203',
          stock_name: 'トヨタ自動車',
          shares: 200,
          acquisition_price: 3000,
          account_type: 'specific',
        },
      ];

      const result = checkDuplicates(newHoldings, existingHoldings);

      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].rowNumber).toBe(0);
      expect(result.duplicates[0].stockCode).toBe('7203');
      expect(result.duplicates[0].accountType).toBe('specific');
      expect(result.duplicates[0].existingHoldingId).toBe('id-1');
    });

    it('同一銘柄コードでも異なる口座種別は重複しない', () => {
      const existingHoldings: Holding[] = [
        createExistingHolding('id-1', '7203', 'specific'),
      ];

      const newHoldings: NewHolding[] = [
        {
          stock_code: '7203',
          stock_name: 'トヨタ自動車',
          shares: 200,
          acquisition_price: 3000,
          account_type: 'nisa_growth', // 異なる口座種別
        },
      ];

      const result = checkDuplicates(newHoldings, existingHoldings);

      expect(result.duplicates).toHaveLength(0);
    });

    it('異なる銘柄コードは重複しない', () => {
      const existingHoldings: Holding[] = [
        createExistingHolding('id-1', '7203', 'specific'),
      ];

      const newHoldings: NewHolding[] = [
        {
          stock_code: '9984', // 異なる銘柄コード
          stock_name: 'ソフトバンク',
          shares: 200,
          acquisition_price: 3000,
          account_type: 'specific',
        },
      ];

      const result = checkDuplicates(newHoldings, existingHoldings);

      expect(result.duplicates).toHaveLength(0);
    });

    it('複数の重複を検出する', () => {
      const existingHoldings: Holding[] = [
        createExistingHolding('id-1', '7203', 'specific'),
        createExistingHolding('id-2', '9984', 'nisa_growth'),
      ];

      const newHoldings: NewHolding[] = [
        {
          stock_code: '7203',
          shares: 100,
          account_type: 'specific',
        },
        {
          stock_code: '8306',
          shares: 200,
          account_type: 'specific',
        },
        {
          stock_code: '9984',
          shares: 50,
          account_type: 'nisa_growth',
        },
      ];

      const result = checkDuplicates(newHoldings, existingHoldings);

      expect(result.duplicates).toHaveLength(2);
      expect(result.duplicates[0].rowNumber).toBe(0);
      expect(result.duplicates[0].stockCode).toBe('7203');
      expect(result.duplicates[1].rowNumber).toBe(2);
      expect(result.duplicates[1].stockCode).toBe('9984');
    });

    it('既存データが空の場合は重複なし', () => {
      const existingHoldings: Holding[] = [];

      const newHoldings: NewHolding[] = [
        {
          stock_code: '7203',
          shares: 100,
          account_type: 'specific',
        },
      ];

      const result = checkDuplicates(newHoldings, existingHoldings);

      expect(result.duplicates).toHaveLength(0);
    });

    it('新規データが空の場合は重複なし', () => {
      const existingHoldings: Holding[] = [
        createExistingHolding('id-1', '7203', 'specific'),
      ];

      const newHoldings: NewHolding[] = [];

      const result = checkDuplicates(newHoldings, existingHoldings);

      expect(result.duplicates).toHaveLength(0);
    });
  });
});

describe('processBatchItem', () => {
  const createExistingHolding = (
    id: string,
    stockCode: string,
    accountType: Holding['account_type']
  ): Holding => ({
    id,
    user_id: 'user-123',
    stock_code: stockCode,
    stock_name: `銘柄${stockCode}`,
    shares: 100,
    acquisition_price: 1000,
    account_type: accountType,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  });

  describe('新規登録（重複なし）', () => {
    it('重複がない場合はinsertアクションを返す', () => {
      const newHolding: NewHolding = {
        stock_code: '7203',
        stock_name: 'トヨタ自動車',
        shares: 100,
        acquisition_price: 2500,
        account_type: 'specific',
      };
      const duplicateInfo = undefined;
      const strategy: DuplicateStrategy = 'skip';

      const result = processBatchItem(newHolding, duplicateInfo, strategy);

      expect(result.action).toBe('insert');
      if (result.action === 'insert') {
        expect(result.holding).toEqual(newHolding);
      }
    });
  });

  describe('スキップ戦略', () => {
    it('重複ありでstrategy=skipの場合はskipアクションを返す', () => {
      const newHolding: NewHolding = {
        stock_code: '7203',
        stock_name: 'トヨタ自動車',
        shares: 200,
        acquisition_price: 3000,
        account_type: 'specific',
      };
      const duplicateInfo: DuplicateInfo = {
        rowNumber: 0,
        stockCode: '7203',
        accountType: 'specific',
        existingHoldingId: 'id-1',
      };
      const strategy: DuplicateStrategy = 'skip';

      const result = processBatchItem(newHolding, duplicateInfo, strategy);

      expect(result.action).toBe('skip');
      if (result.action === 'skip') {
        expect(result.existingHoldingId).toBe('id-1');
      }
    });
  });

  describe('上書き戦略', () => {
    it('重複ありでstrategy=overwriteの場合はupdateアクションを返す', () => {
      const newHolding: NewHolding = {
        stock_code: '7203',
        stock_name: 'トヨタ自動車',
        shares: 200,
        acquisition_price: 3000,
        account_type: 'specific',
      };
      const duplicateInfo: DuplicateInfo = {
        rowNumber: 0,
        stockCode: '7203',
        accountType: 'specific',
        existingHoldingId: 'id-1',
      };
      const strategy: DuplicateStrategy = 'overwrite';

      const result = processBatchItem(newHolding, duplicateInfo, strategy);

      expect(result.action).toBe('update');
      if (result.action === 'update') {
        expect(result.existingHoldingId).toBe('id-1');
        expect(result.holding).toEqual(newHolding);
      }
    });
  });
});

describe('ProcessBatchItemResult type', () => {
  it('insertアクションの型', () => {
    const result: ProcessBatchItemResult = {
      action: 'insert',
      holding: {
        stock_code: '7203',
        shares: 100,
        account_type: 'specific',
      },
    };

    expect(result.action).toBe('insert');
  });

  it('skipアクションの型', () => {
    const result: ProcessBatchItemResult = {
      action: 'skip',
      existingHoldingId: 'id-1',
    };

    expect(result.action).toBe('skip');
    expect(result.existingHoldingId).toBe('id-1');
  });

  it('updateアクションの型', () => {
    const result: ProcessBatchItemResult = {
      action: 'update',
      existingHoldingId: 'id-1',
      holding: {
        stock_code: '7203',
        shares: 200,
        account_type: 'specific',
      },
    };

    expect(result.action).toBe('update');
    expect(result.existingHoldingId).toBe('id-1');
  });
});

describe('統合テスト: checkDuplicatesとprocessBatchItem', () => {
  const createExistingHolding = (
    id: string,
    stockCode: string,
    accountType: Holding['account_type']
  ): Holding => ({
    id,
    user_id: 'user-123',
    stock_code: stockCode,
    stock_name: `銘柄${stockCode}`,
    shares: 100,
    acquisition_price: 1000,
    account_type: accountType,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  });

  describe('重複スキップ戦略の統合テスト', () => {
    it('100件のデータで重複チェックとスキップ戦略処理ができる', () => {
      // 100件のCSVデータをシミュレート
      const newHoldings: NewHolding[] = Array.from({ length: 100 }, (_, i) => ({
        stock_code: `${1000 + i}`,
        stock_name: `銘柄${1000 + i}`,
        shares: 100,
        account_type: 'specific' as const,
      }));

      // 最初の10件は既存データと重複
      const existingHoldings: Holding[] = Array.from({ length: 10 }, (_, i) =>
        createExistingHolding(`id-${i}`, `${1000 + i}`, 'specific')
      );

      const startTime = Date.now();

      // 重複チェック
      const { duplicates } = checkDuplicates(newHoldings, existingHoldings);

      // 重複マップ作成
      const duplicateMap = new Map<number, DuplicateInfo>();
      for (const dup of duplicates) {
        duplicateMap.set(dup.rowNumber, dup);
      }

      // 各アイテムを処理
      const results = newHoldings.map((holding, index) =>
        processBatchItem(holding, duplicateMap.get(index), 'skip')
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // 10件が重複としてスキップ
      expect(duplicates).toHaveLength(10);

      // スキップアクションが10件
      const skipCount = results.filter((r) => r.action === 'skip').length;
      expect(skipCount).toBe(10);

      // インサートアクションが90件
      const insertCount = results.filter((r) => r.action === 'insert').length;
      expect(insertCount).toBe(90);

      // パフォーマンス: 5秒以内（実際には非常に高速のはず）
      expect(processingTime).toBeLessThan(5000);
    });
  });

  describe('重複上書き戦略の統合テスト', () => {
    it('重複データをoverwrite戦略で処理できる', () => {
      const newHoldings: NewHolding[] = [
        { stock_code: '7203', shares: 200, account_type: 'specific' },
        { stock_code: '8306', shares: 150, account_type: 'specific' },
        { stock_code: '9984', shares: 100, account_type: 'nisa_growth' },
      ];

      const existingHoldings: Holding[] = [
        createExistingHolding('id-1', '7203', 'specific'),
        createExistingHolding('id-2', '9984', 'nisa_growth'),
      ];

      const { duplicates } = checkDuplicates(newHoldings, existingHoldings);

      const duplicateMap = new Map<number, DuplicateInfo>();
      for (const dup of duplicates) {
        duplicateMap.set(dup.rowNumber, dup);
      }

      const results = newHoldings.map((holding, index) =>
        processBatchItem(holding, duplicateMap.get(index), 'overwrite')
      );

      // 7203: 重複 -> update
      expect(results[0].action).toBe('update');

      // 8306: 新規 -> insert
      expect(results[1].action).toBe('insert');

      // 9984: 重複 -> update
      expect(results[2].action).toBe('update');
    });
  });
});

describe('BatchOperationTracker', () => {
  describe('createBatchOperationTracker', () => {
    it('初期状態は空のトラッカーを返す', () => {
      const tracker = createBatchOperationTracker();

      expect(tracker.insertedIds).toEqual([]);
      expect(tracker.updatedIds).toEqual([]);
      expect(tracker.skippedCount).toBe(0);
      expect(tracker.errors).toEqual([]);
    });
  });

  describe('補償処理確認', () => {
    it('trackInsert後にgetInsertedIdsForRollbackで挿入済みIDを取得できる', () => {
      const tracker = createBatchOperationTracker();

      tracker.trackInsert('id-1');
      tracker.trackInsert('id-2');

      const idsForRollback = tracker.getInsertedIdsForRollback();

      expect(idsForRollback).toEqual(['id-1', 'id-2']);
    });

    it('更新IDはロールバック対象に含まれない', () => {
      const tracker = createBatchOperationTracker();

      tracker.trackInsert('insert-1');
      tracker.trackUpdate('update-1');
      tracker.trackInsert('insert-2');

      const idsForRollback = tracker.getInsertedIdsForRollback();

      expect(idsForRollback).toEqual(['insert-1', 'insert-2']);
      expect(idsForRollback).not.toContain('update-1');
    });
  });

  describe('trackInsert', () => {
    it('挿入されたIDを追跡する', () => {
      const tracker = createBatchOperationTracker();

      tracker.trackInsert('uuid-1');
      tracker.trackInsert('uuid-2');

      expect(tracker.insertedIds).toEqual(['uuid-1', 'uuid-2']);
    });
  });

  describe('trackUpdate', () => {
    it('更新されたIDを追跡する', () => {
      const tracker = createBatchOperationTracker();

      tracker.trackUpdate('uuid-1');
      tracker.trackUpdate('uuid-2');

      expect(tracker.updatedIds).toEqual(['uuid-1', 'uuid-2']);
    });
  });

  describe('trackSkip', () => {
    it('スキップ件数をインクリメントする', () => {
      const tracker = createBatchOperationTracker();

      tracker.trackSkip();
      tracker.trackSkip();

      expect(tracker.skippedCount).toBe(2);
    });
  });

  describe('trackError', () => {
    it('エラー情報を追跡する', () => {
      const tracker = createBatchOperationTracker();

      tracker.trackError(0, 'バリデーションエラー');
      tracker.trackError(2, 'DB挿入エラー');

      expect(tracker.errors).toEqual([
        { row: 0, reason: 'バリデーションエラー' },
        { row: 2, reason: 'DB挿入エラー' },
      ]);
    });
  });

  describe('getResult', () => {
    it('処理結果のサマリーを返す', () => {
      const tracker = createBatchOperationTracker();

      tracker.trackInsert('uuid-1');
      tracker.trackInsert('uuid-2');
      tracker.trackUpdate('uuid-3');
      tracker.trackSkip();
      tracker.trackError(3, 'エラー');

      const result = tracker.getResult();

      expect(result.imported).toBe(3); // insert 2 + update 1
      expect(result.skipped).toBe(1);
      expect(result.errors).toEqual([{ row: 3, reason: 'エラー' }]);
    });
  });

  describe('getInsertedIdsForRollback', () => {
    it('ロールバック用に挿入済みIDを返す', () => {
      const tracker = createBatchOperationTracker();

      tracker.trackInsert('uuid-1');
      tracker.trackInsert('uuid-2');
      tracker.trackUpdate('uuid-3');

      const ids = tracker.getInsertedIdsForRollback();

      // 挿入されたIDのみ（更新は元に戻す必要がないが、設計上は含める）
      expect(ids).toEqual(['uuid-1', 'uuid-2']);
    });
  });

  describe('hasErrors', () => {
    it('エラーがない場合はfalseを返す', () => {
      const tracker = createBatchOperationTracker();

      tracker.trackInsert('uuid-1');

      expect(tracker.hasErrors()).toBe(false);
    });

    it('エラーがある場合はtrueを返す', () => {
      const tracker = createBatchOperationTracker();

      tracker.trackError(0, 'エラー');

      expect(tracker.hasErrors()).toBe(true);
    });
  });
});
