# PR#1: プロジェクト初期設定 + Supabase接続

## 参照ドキュメント
- docs/product.md「技術スタック」節
- docs/product.md「開発ルール」節
- docs/product.md「画面構成」節（ルーティング構造のみ）

## 目的
Haitoアプリの基盤となるNext.js 14プロジェクトを作成し、Supabaseクライアント接続を確立する。後続PRで認証・DB操作を実装できる状態にする。

## 範囲

### In scope
- Next.js 14 (App Router) プロジェクトの初期化
- TypeScript strict mode 設定
- Tailwind CSS + shadcn/ui のセットアップ
- Supabase クライアント設定（`@supabase/supabase-js`）
  - サーバーコンポーネント用クライアント
  - クライアントコンポーネント用クライアント
- 環境変数ファイル（`.env.local.example`）
- 共通型定義ファイル（`/types/database.ts`）
  - holdings, dividend_data, user_settings の型
  - account_type の enum型
- ESLint + Prettier 設定
- 基本ディレクトリ構造の作成
  ```
  /app
    /layout.tsx
    /page.tsx（ランディングページのプレースホルダー）
  /components
    /ui（shadcn/ui）
  /lib
    /supabase/client.ts
    /supabase/server.ts
  /types
    /database.ts
  ```

### Out of scope
- 認証機能の実装（PR#2）
- DBテーブル作成・マイグレーション（PR#3）
- 各画面のUI実装
- Zustand設定（銘柄データを扱うPR#4で導入）
- Vercelデプロイ設定

## 技術固定（変更禁止）
- Next.js 14 (App Router) を使用すること
- TypeScript strict: true
- Supabase クライアントライブラリ: `@supabase/supabase-js` v2系
- UI: Tailwind CSS v3 + shadcn/ui
- ファイル名: kebab-case
- Node.js 20.x

## 受け入れ条件（AC）
- [ ] `npm run dev` でエラーなく起動する
- [ ] `npm run build` が成功する
- [ ] `npm run lint` がエラーなしで通過する
- [ ] `/` にアクセスするとプレースホルダーページが表示される
- [ ] Supabase クライアントが正しく初期化される（環境変数設定後に接続テスト可能な状態）
- [ ] `/types/database.ts` に holdings, dividend_data, user_settings の型が定義されている
- [ ] `.env.local.example` に必要な環境変数がコメント付きで記載されている
- [ ] shadcn/ui の Button コンポーネントがインストールされている（動作確認用）

## 禁止事項
- スキーマ設計の変更・再設計
- スコープ外機能の先行実装
- 独自UIコンポーネントライブラリの導入（shadcn/ui以外）
- pages/ ディレクトリの使用（App Routerのみ）
- 認証ミドルウェアの実装（PR#2で行う）

## 成果物
1. **コード:** 上記ディレクトリ構造に従ったソースコード
2. **設定ファイル:** tsconfig.json, tailwind.config.ts, .eslintrc.json, .prettierrc
3. **ドキュメント:** .env.local.example（環境変数テンプレート）
4. **PR要約:** 実装内容・セットアップ手順を記載

## 質問（最大3つ）
1. Supabaseプロジェクトは既に作成済みか？（未作成の場合、URL/KEYはダミー値で進める）
2. shadcn/uiで最初からインストールしておくべきコンポーネントはあるか？（なければButtonのみ）
3. CI/CD（GitHub Actions等）の設定はこのPRに含めるか？
