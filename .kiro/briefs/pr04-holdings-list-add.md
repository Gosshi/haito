# PR#4: 銘柄一覧表示 + 登録機能

## 参照ドキュメント
- docs/product.md「F2: 銘柄登録・編集・削除」節
- docs/product.md「画面構成」節（/portfolio, /portfolio/add）
- docs/product.md「データベーススキーマ」節（holdings テーブル）

## 目的
ユーザーが保有銘柄を登録し、一覧表示できるようにする。銘柄追加フォームで必要情報を入力し、holdingsテーブルに保存する。

## 範囲

### In scope
- `/portfolio` ページ（銘柄一覧）
  - テーブル形式で保有銘柄を表示
  - 表示項目: 銘柄コード、銘柄名、保有株数、取得単価、口座種別
  - 「銘柄を追加」ボタン
  - 銘柄がない場合の空状態UI
- `/portfolio/add` ページ（銘柄追加フォーム）
  - 入力項目:
    - 銘柄コード（4桁、必須）
    - 銘柄名（自動取得 or 手動入力）
    - 保有株数（必須、正の整数）
    - 取得単価（任意、正の数値）
    - 口座種別（必須、セレクト: 特定口座 / NISA成長投資枠 / NISAつみたて投資枠）
  - フォームバリデーション
  - 登録成功後 `/portfolio` へリダイレクト
- Zustand store の導入
  - holdings の状態管理
  - CRUD アクション
- Supabase との連携（holdings テーブルへのINSERT/SELECT）

### Out of scope
- 銘柄の編集機能（PR#5）
- 銘柄の削除機能（PR#5）
- 配当データの取得・表示（PR#6, PR#7）
- 銘柄コードからの銘柄名自動取得（PR#6で配当データと一緒に実装、ここでは手動入力）
- CSV一括インポート（Phase 2）

## 技術固定（変更禁止）
- 状態管理: Zustand を使用
- UIコンポーネント: shadcn/ui の Table, Input, Select, Button, Label, Card を使用
- データ取得: Supabase クライアント経由
- 口座種別の値: 'specific' | 'nisa_growth' | 'nisa_tsumitate'

## 受け入れ条件（AC）
- [ ] `/portfolio` で保有銘柄一覧がテーブル形式で表示される
- [ ] 銘柄がない場合、空状態のメッセージと追加ボタンが表示される
- [ ] `/portfolio/add` で銘柄追加フォームが表示される
- [ ] 銘柄コード・保有株数・口座種別は必須入力でバリデーションされる
- [ ] 同一ユーザー・同一銘柄コード・同一口座種別の重複登録時にエラーが表示される
- [ ] 登録成功後 `/portfolio` にリダイレクトされ、新規銘柄が一覧に表示される
- [ ] ページリロード後もデータが保持される（Supabaseに永続化）
- [ ] 未認証ユーザーは `/login` にリダイレクトされる

## 禁止事項
- Zustand 以外の状態管理ライブラリの導入
- holdings テーブルスキーマの変更
- 編集・削除機能の実装（PR#5で行う）
- 外部API呼び出し（銘柄名取得等）の実装

## 成果物
1. **コード:**
   - `/app/portfolio/page.tsx`
   - `/app/portfolio/add/page.tsx`
   - `/components/portfolio/holdings-table.tsx`
   - `/components/portfolio/add-holding-form.tsx`
   - `/stores/holdings-store.ts`（Zustand store）
   - `/lib/api/holdings.ts`（Supabase操作関数）
2. **PR要約:** 機能説明、画面スクリーンショット

## 質問（最大3つ）
1. 銘柄名は現時点では手動入力で良いか？（自動取得はPR#6で実装予定）
2. 一覧のソート順は登録日時の降順（新しい順）で良いか？
3. 口座種別の日本語表示ラベルは「特定口座」「NISA成長投資枠」「NISAつみたて投資枠」で良いか？
