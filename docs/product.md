# Haito - /kiro:spec-init 説明文
## プロジェクト説明

**プロジェクト名:** Haito（配当）

**概要:**
日本株の高配当投資家向けの配当管理Webアプリケーション。保有銘柄を登録すると、配当データを自動取得し、年間配当額・月別配当カレンダー・NISA枠別集計を表示する。

**ターゲットユーザー:**
- 新NISA成長投資枠で日本株の高配当投資をしている個人投資家
- 複数銘柄（10-50銘柄）を保有し、配当金を体系的に管理したい人
- 既存のスマホアプリ（配当管理、配当キング等）に不満を持つユーザー

**解決する課題:**
1. 既存アプリは手動入力が面倒
2. グラフや計算の不具合が多い
3. NISA口座と特定口座を分けて管理できない
4. PCの大画面で分析したいがスマホアプリしかない

---

## 技術スタック

- **フロントエンド:** Next.js 14 (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **状態管理:** Zustand
- **認証:** Supabase Auth
- **データベース:** Supabase (PostgreSQL)
- **配当データ取得:** Yahoo Finance API / スクレイピング
- **ホスティング:** Vercel
- **決済（将来）:** Stripe
- **iOS化（将来）:** Capacitor

---

## MVP機能要件（Phase 1: Week 1-2）

### F1: ユーザー認証
- メールアドレス + パスワードでサインアップ/ログイン
- ログアウト機能
- 認証状態の永続化

### F2: 銘柄登録・編集・削除
- 以下の情報を登録:
  - 銘柄コード（4桁）
  - 銘柄名（自動取得）
  - 保有株数
  - 取得単価
  - 口座種別（特定口座 / NISA成長投資枠 / NISAつみたて投資枠）
- 銘柄一覧の表示
- 編集・削除機能

### F3: 配当データ自動取得
- 銘柄コードから年間配当金（予想）を自動取得
- 配当月（権利確定月）の自動取得
- 1日1回のデータ更新（または手動更新ボタン）

### F4: 年間配当額表示
- 保有銘柄の年間配当合計を表示
- 口座種別ごとの内訳（税引前/税引後）
  - 特定口座: 20.315%課税
  - NISA: 非課税
- 配当利回り（取得価格ベース）の表示

### F5: 月別配当カレンダー
- 12ヶ月のカレンダー形式で配当入金予定を表示
- 各月にどの銘柄からいくら入金されるかを表示
- 棒グラフでの月別配当額可視化

---

## Phase 2機能（Week 3-4）

### F6: CSV一括インポート
- SBI証券/楽天証券のCSV形式に対応
- 一括で複数銘柄を登録

### F7: 配当利回りランキング
- 保有銘柄を配当利回り順にソート表示

### F8: 目標設定
- 年間配当目標額を設定
- 目標に対する進捗率を表示

---

## データベーススキーマ

```sql
-- ユーザー（Supabase Authで管理）

-- 保有銘柄
CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_code VARCHAR(10) NOT NULL,        -- 銘柄コード（例: 8306）
  stock_name VARCHAR(100),                -- 銘柄名（例: 三菱UFJ）
  shares INTEGER NOT NULL,                -- 保有株数
  acquisition_price DECIMAL(10,2),        -- 取得単価
  account_type VARCHAR(20) NOT NULL,      -- 'specific' | 'nisa_growth' | 'nisa_tsumitate'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, stock_code, account_type)
);

-- 配当データ（キャッシュ）
CREATE TABLE dividend_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_code VARCHAR(10) NOT NULL UNIQUE,
  stock_name VARCHAR(100),
  annual_dividend DECIMAL(10,2),          -- 年間配当金（1株あたり）
  dividend_yield DECIMAL(5,2),            -- 配当利回り（%）
  ex_dividend_months INTEGER[],           -- 権利確定月（例: [3, 9]）
  payment_months INTEGER[],               -- 配当支払月（例: [6, 12]）
  last_updated TIMESTAMP DEFAULT NOW()
);

-- ユーザー設定
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  annual_dividend_goal DECIMAL(12,2),     -- 年間配当目標
  display_currency VARCHAR(3) DEFAULT 'JPY',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 画面構成

```
/                   → ランディングページ（未ログイン時）
/login              → ログイン
/signup             → サインアップ
/dashboard          → ダッシュボード（年間配当サマリー）
/portfolio          → 銘柄一覧・登録・編集
/portfolio/add      → 銘柄追加フォーム
/calendar           → 月別配当カレンダー
/settings           → 設定（目標設定、アカウント）
```

---

## 開発ルール

### 重要：役割分担
- **設計（spec, doc）:** Claude Code で実行
- **実装（code）:** Codex で実行

### コーディング規約
- TypeScript strict mode
- ESLint + Prettier
- コンポーネントは関数コンポーネント + hooks
- ファイル名: kebab-case
- 型定義は `/types` ディレクトリに集約

### Git運用
- main: 本番
- develop: 開発
- feature/*: 機能ブランチ

---

## 非機能要件

- **パフォーマンス:** 初期表示3秒以内
- **セキュリティ:** Supabase RLSでユーザーデータ分離
- **レスポンシブ:** PC優先、タブレット対応（スマホは後でCapacitor化）

---

## 将来の拡張（Phase 3以降）

- iOS/Androidアプリ化（Capacitor）
- 米国株対応
- 増配履歴トラッキング
- ポートフォリオ分析（セクター分散等）
- 有料プラン（Stripe連携）

---

*この説明を元にcc-sddワークフローでspec → doc → code と進めてください。*