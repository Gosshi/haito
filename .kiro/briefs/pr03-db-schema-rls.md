# PR#3: DBスキーマ作成 + RLS設定

## 参照ドキュメント
- docs/product.md「データベーススキーマ」節（全テーブル定義）
- docs/product.md「非機能要件」節（Supabase RLSでユーザーデータ分離）

## 目的
Supabase上に holdings, dividend_data, user_settings テーブルを作成し、Row Level Security (RLS) を設定してユーザーデータを安全に分離する。

## 範囲

### In scope
- Supabase SQL マイグレーションファイルの作成
- `holdings` テーブル作成
  - id, user_id, stock_code, stock_name, shares, acquisition_price, account_type, created_at, updated_at
  - UNIQUE制約: (user_id, stock_code, account_type)
- `dividend_data` テーブル作成
  - id, stock_code, stock_name, annual_dividend, dividend_yield, ex_dividend_months, payment_months, last_updated
  - UNIQUE制約: stock_code
- `user_settings` テーブル作成
  - user_id (PK), annual_dividend_goal, display_currency, created_at, updated_at
- RLSポリシー設定
  - holdings: ユーザーは自分のデータのみCRUD可能
  - dividend_data: 全ユーザーがSELECT可能（共有キャッシュ）、INSERT/UPDATEはサービスロールのみ
  - user_settings: ユーザーは自分のデータのみCRUD可能
- インデックス作成（必要な箇所）
- `/supabase/migrations/` ディレクトリ構造

### Out of scope
- シードデータの投入
- テーブル以外のSupabase機能設定（Storage, Edge Functions等）
- バックアップ設定
- 本番環境へのマイグレーション実行

## 技術固定（変更禁止）
- docs/product.md に記載されたスキーマを厳密に再現すること
- カラム名・型・制約は変更禁止
- Supabase CLIのマイグレーション形式を使用
- RLSは必ず有効化すること

## 受け入れ条件（AC）
- [ ] `supabase db push` または `supabase migration up` でエラーなく適用できる
- [ ] holdings テーブルが作成され、RLSが有効である
- [ ] dividend_data テーブルが作成され、RLSが有効である
- [ ] user_settings テーブルが作成され、RLSが有効である
- [ ] 認証済みユーザーが自分の holdings を INSERT/SELECT/UPDATE/DELETE できる
- [ ] 認証済みユーザーが他ユーザーの holdings にアクセスできない
- [ ] 認証済みユーザーが dividend_data を SELECT できる
- [ ] 認証済みユーザーが自分の user_settings を INSERT/SELECT/UPDATE/DELETE できる
- [ ] holdings の (user_id, stock_code, account_type) にUNIQUE制約がある

## 禁止事項
- スキーマ設計の変更・再設計（docs/product.md の定義に従う）
- RLSの無効化
- カスケード削除以外の外部キー制約の変更
- テーブル名・カラム名の変更

## 成果物
1. **コード:**
   - `/supabase/migrations/YYYYMMDDHHMMSS_create_tables.sql`
   - `/supabase/migrations/YYYYMMDDHHMMSS_setup_rls.sql`（または統合可）
2. **ドキュメント:** マイグレーション適用手順（PR説明に記載）
3. **PR要約:** 作成したテーブル・RLSポリシーの一覧

## 質問（最大3つ）
1. Supabase CLIはプロジェクトに既にセットアップ済みか？（未設定の場合、supabase init から行う）
2. dividend_dataへのINSERT/UPDATEはサーバーサイド（Edge Functions or API Route）で行う想定で良いか？
3. updated_at の自動更新トリガーは必要か？
