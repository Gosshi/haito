import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../types/database';
import type { Holding, NewHolding, AccountType } from '../holdings/types';

// 重複戦略の型定義
export type DuplicateStrategy = 'skip' | 'overwrite';

// APIリクエスト型
export interface BulkImportRequest {
  holdings: NewHolding[];
  duplicateStrategy: DuplicateStrategy;
}

// APIレスポンスのエラー型
export interface BulkImportError {
  row: number;
  reason: string;
}

// APIレスポンス型
export interface BulkImportResponse {
  success: boolean;
  imported: number;
  skipped: number;
  errors: BulkImportError[];
}

// サービス層のエラー型
export type BulkImportErrorType =
  | 'validation'
  | 'database'
  | 'unauthorized'
  | 'unknown';

export interface BulkImportServiceError {
  type: BulkImportErrorType;
  message: string;
}

// サービス層のアイテムエラー型
export interface BulkImportItemError {
  row: number;
  reason: string;
}

// サービス層の成功結果型
export interface BulkImportSuccessResult {
  ok: true;
  imported: number;
  skipped: number;
  errors: BulkImportItemError[];
}

// サービス層の失敗結果型
export interface BulkImportFailureResult {
  ok: false;
  error: BulkImportServiceError;
}

// サービス層の結果型（Result Pattern）
export type BulkImportResult = BulkImportSuccessResult | BulkImportFailureResult;

// 重複情報型
export interface DuplicateInfo {
  rowNumber: number;
  stockCode: string;
  accountType: AccountType;
  existingHoldingId: string;
}

// 重複チェック結果型
export interface DuplicateCheckResult {
  duplicates: DuplicateInfo[];
}

/**
 * 新規保有銘柄と既存保有銘柄の重複をチェックする
 * 重複は銘柄コード + 口座種別の組み合わせで判定
 */
export function checkDuplicates(
  newHoldings: NewHolding[],
  existingHoldings: Holding[]
): DuplicateCheckResult {
  // 既存データを銘柄コード+口座種別でインデックス化
  const existingMap = new Map<string, Holding>();
  for (const holding of existingHoldings) {
    const key = `${holding.stock_code}:${holding.account_type}`;
    existingMap.set(key, holding);
  }

  // 新規データをチェック
  const duplicates: DuplicateInfo[] = [];
  newHoldings.forEach((newHolding, index) => {
    const key = `${newHolding.stock_code}:${newHolding.account_type}`;
    const existing = existingMap.get(key);
    if (existing) {
      duplicates.push({
        rowNumber: index,
        stockCode: newHolding.stock_code,
        accountType: newHolding.account_type,
        existingHoldingId: existing.id,
      });
    }
  });

  return { duplicates };
}

// バッチ処理アイテム結果型
export type ProcessBatchItemResult =
  | { action: 'insert'; holding: NewHolding }
  | { action: 'skip'; existingHoldingId: string }
  | { action: 'update'; existingHoldingId: string; holding: NewHolding };

/**
 * 単一アイテムのバッチ処理アクションを決定する
 */
export function processBatchItem(
  holding: NewHolding,
  duplicateInfo: DuplicateInfo | undefined,
  strategy: DuplicateStrategy
): ProcessBatchItemResult {
  // 重複なし → INSERT
  if (!duplicateInfo) {
    return { action: 'insert', holding };
  }

  // 重複あり → 戦略に応じて処理
  if (strategy === 'skip') {
    return { action: 'skip', existingHoldingId: duplicateInfo.existingHoldingId };
  }

  // overwrite
  return {
    action: 'update',
    existingHoldingId: duplicateInfo.existingHoldingId,
    holding,
  };
}

// バッチ処理結果サマリー型
interface BatchOperationResultSummary {
  imported: number;
  skipped: number;
  errors: BulkImportItemError[];
}

// バッチ操作トラッカーインターフェース
export interface BatchOperationTracker {
  insertedIds: string[];
  updatedIds: string[];
  skippedCount: number;
  errors: BulkImportItemError[];
  trackInsert: (id: string) => void;
  trackUpdate: (id: string) => void;
  trackSkip: () => void;
  trackError: (row: number, reason: string) => void;
  getResult: () => BatchOperationResultSummary;
  getInsertedIdsForRollback: () => string[];
  hasErrors: () => boolean;
}

/**
 * バッチ操作を追跡するトラッカーを作成する
 * 補償処理のために挿入済みIDを追跡し、エラー時のロールバックを可能にする
 */
export function createBatchOperationTracker(): BatchOperationTracker {
  const insertedIds: string[] = [];
  const updatedIds: string[] = [];
  let skippedCount = 0;
  const errors: BulkImportItemError[] = [];

  return {
    get insertedIds() {
      return [...insertedIds];
    },
    get updatedIds() {
      return [...updatedIds];
    },
    get skippedCount() {
      return skippedCount;
    },
    get errors() {
      return [...errors];
    },
    trackInsert(id: string) {
      insertedIds.push(id);
    },
    trackUpdate(id: string) {
      updatedIds.push(id);
    },
    trackSkip() {
      skippedCount++;
    },
    trackError(row: number, reason: string) {
      errors.push({ row, reason });
    },
    getResult(): BatchOperationResultSummary {
      return {
        imported: insertedIds.length + updatedIds.length,
        skipped: skippedCount,
        errors: [...errors],
      };
    },
    getInsertedIdsForRollback(): string[] {
      return [...insertedIds];
    },
    hasErrors(): boolean {
      return errors.length > 0;
    },
  };
}

/**
 * 保有銘柄を一括インポートする
 * 補償処理によるトランザクション管理を実装
 */
export async function bulkImportHoldings(
  supabase: SupabaseClient<Database>,
  userId: string,
  holdings: NewHolding[],
  strategy: DuplicateStrategy
): Promise<BulkImportResult> {
  // 既存データの取得
  const { data: existingData, error: fetchError } = await supabase
    .from('holdings')
    .select('id, user_id, stock_code, stock_name, shares, acquisition_price, account_type, created_at, updated_at')
    .eq('user_id', userId);

  if (fetchError) {
    return {
      ok: false,
      error: { type: 'database', message: fetchError.message },
    };
  }

  const existingHoldings = (existingData ?? []) as Holding[];

  // 重複チェック
  const { duplicates } = checkDuplicates(holdings, existingHoldings);

  // 重複情報をマップ化
  const duplicateMap = new Map<number, DuplicateInfo>();
  for (const dup of duplicates) {
    duplicateMap.set(dup.rowNumber, dup);
  }

  // バッチ処理トラッカーを作成
  const tracker = createBatchOperationTracker();

  // 各holdingを処理
  for (let i = 0; i < holdings.length; i++) {
    const holding = holdings[i];
    const duplicateInfo = duplicateMap.get(i);
    const action = processBatchItem(holding, duplicateInfo, strategy);

    if (action.action === 'skip') {
      tracker.trackSkip();
      continue;
    }

    if (action.action === 'insert') {
      const { data: insertData, error: insertError } = await supabase
        .from('holdings')
        .insert({
          user_id: userId,
          stock_code: holding.stock_code.trim(),
          stock_name: holding.stock_name?.trim() || null,
          shares: holding.shares,
          acquisition_price: holding.acquisition_price ?? null,
          account_type: holding.account_type,
        })
        .select('id')
        .single();

      if (insertError) {
        tracker.trackError(i, insertError.message);
        // 補償処理: 挿入済みレコードを削除
        const idsToDelete = tracker.getInsertedIdsForRollback();
        if (idsToDelete.length > 0) {
          await supabase
            .from('holdings')
            .delete()
            .in('id', idsToDelete);
          console.error('[bulkImportHoldings] Rollback completed:', idsToDelete);
        }
        return {
          ok: false,
          error: { type: 'database', message: `Row ${i}: ${insertError.message}` },
        };
      }

      if (insertData && typeof insertData.id === 'string') {
        tracker.trackInsert(insertData.id);
      }
      continue;
    }

    if (action.action === 'update') {
      const { error: updateError } = await supabase
        .from('holdings')
        .update({
          stock_name: holding.stock_name?.trim() || null,
          shares: holding.shares,
          acquisition_price: holding.acquisition_price ?? null,
          account_type: holding.account_type,
        })
        .eq('id', action.existingHoldingId)
        .eq('user_id', userId);

      if (updateError) {
        tracker.trackError(i, updateError.message);
        // 補償処理: 挿入済みレコードを削除
        const idsToDelete = tracker.getInsertedIdsForRollback();
        if (idsToDelete.length > 0) {
          await supabase
            .from('holdings')
            .delete()
            .in('id', idsToDelete);
          console.error('[bulkImportHoldings] Rollback completed:', idsToDelete);
        }
        return {
          ok: false,
          error: { type: 'database', message: `Row ${i}: ${updateError.message}` },
        };
      }

      tracker.trackUpdate(action.existingHoldingId);
    }
  }

  const result = tracker.getResult();
  return {
    ok: true,
    imported: result.imported,
    skipped: result.skipped,
    errors: result.errors,
  };
}
