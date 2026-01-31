# PR#14: 目標設定API - DBスキーマ拡張・CRUD API

## 参照ドキュメント
- docs/product_phase2.md「F8: 目標設定と進捗表示」節
- docs/product_phase2.md「データベース変更」（L114-123）
- docs/product_phase2.md「目標設定仕様」（L92-97）

## 目的
年間配当目標を設定・取得するAPIを実装する。
`user_settings` テーブルに `goal_deadline_year` カラムを追加する。

## 範囲

### In scope
- DBマイグレーション: `goal_deadline_year` カラム追加
- `/api/settings` GET/PATCH エンドポイント（目標設定用）
- `lib/api/settings.ts` 新規作成
- 目標設定の型定義

### Out of scope
- UI実装（PR#15で対応）
- 進捗計算ロジック（PR#16で対応）

## 技術固定（変更禁止）
- 既存の `user_settings` テーブル構造維持（カラム追加のみ）
- Supabaseマイグレーション使用
- 認証: 既存ミドルウェア使用

## 受け入れ条件（AC）
- [ ] マイグレーションファイル作成: `goal_deadline_year INTEGER` カラム追加
- [ ] `GET /api/settings` で現在の設定を取得
  ```json
  {
    "annual_dividend_goal": 1500000,
    "goal_deadline_year": 2032,
    "display_currency": "JPY"
  }
  ```
- [ ] `PATCH /api/settings` で設定を更新
  ```json
  {
    "annual_dividend_goal": 1500000,
    "goal_deadline_year": 2032
  }
  ```
- [ ] 未設定時は `null` を返す
- [ ] `annual_dividend_goal` は0以上の数値
- [ ] `goal_deadline_year` は現在年以上（任意項目）
- [ ] 未認証リクエストは401を返す
- [ ] 型定義: `lib/settings/types.ts`

## 禁止事項
- 既存カラムの変更・削除
- 他テーブルの変更
- UI実装

## 成果物
1. **コード:**
   - `supabase/migrations/YYYYMMDD_add_goal_deadline_year.sql`
   - `app/api/settings/route.ts`
   - `lib/api/settings.ts`
   - `lib/settings/types.ts`
2. **PR要約:** 目標設定API追加。goal_deadline_yearカラム追加。

## 質問（最大3つ）
なし
