# PR#11: 一括登録API - 重複チェック・バッチ登録処理

## 参照ドキュメント
- docs/product_phase2.md「F6: CSV一括インポート」節
- docs/product_phase2.md「重複チェック仕様」（L53-54）
- docs/product_phase2.md「非機能要件」（L177-178）

## 目的
パースされたCSVデータを一括でDBに登録するAPIを実装する。
既存銘柄との重複チェックを行い、上書き/スキップの選択に対応する。

## 範囲

### In scope
- `/api/holdings/bulk` POST エンドポイント新規作成
- 重複チェックロジック（同一銘柄コード + 同一口座種別）
- バッチ登録処理（トランザクション使用）
- 成功/失敗件数のレスポンス
- PR#10のUIから呼び出し連携

### Out of scope
- 文字コード変換（PR#12で対応）
- SBI/楽天フォーマット固有処理（PR#12, #13で対応）

## 技術固定（変更禁止）
- 既存の `lib/api/holdings.ts` のパターンに従う
- Supabaseクライアント使用（`lib/supabase/server.ts`）
- 認証: 既存のミドルウェアで保護
- DBスキーマ: `holdings` テーブル変更禁止

## 受け入れ条件（AC）
- [ ] `POST /api/holdings/bulk` エンドポイントが存在する
- [ ] リクエストボディ:
  ```json
  {
    "holdings": [{ "stock_code": "8306", ... }],
    "duplicateStrategy": "skip" | "overwrite"
  }
  ```
- [ ] レスポンス:
  ```json
  {
    "success": true,
    "imported": 5,
    "skipped": 2,
    "errors": [{ "row": 3, "reason": "..." }]
  }
  ```
- [ ] `duplicateStrategy: "skip"` で既存銘柄をスキップ
- [ ] `duplicateStrategy: "overwrite"` で既存銘柄を更新
- [ ] 100件のインポートが5秒以内に完了
- [ ] 途中エラー時はトランザクションロールバック
- [ ] 未認証リクエストは401を返す
- [ ] PR#10のUIから「インポート実行」ボタンでAPIを呼び出し
- [ ] インポート完了後、成功/失敗件数をトースト表示
- [ ] インポート成功後、`/portfolio` にリダイレクト

## 禁止事項
- `holdings` テーブルのスキーマ変更
- 既存の個別登録API（`/api/holdings`）の変更
- PR#9, #10のコード変更（連携のためのUI更新は許可）

## 成果物
1. **コード:**
   - `app/api/holdings/bulk/route.ts`
   - `lib/api/holdings-bulk.ts`
   - `components/csv/preview-table.tsx`（重複表示追加）
   - `components/csv/duplicate-strategy-select.tsx`
2. **PR要約:** 一括登録APIを追加。重複チェック・上書き/スキップ対応。

## 質問（最大3つ）
なし
