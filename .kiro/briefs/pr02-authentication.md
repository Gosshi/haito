# PR#2: 認証機能（サインアップ/ログイン/ログアウト）

## 参照ドキュメント
- docs/product.md「F1: ユーザー認証」節
- docs/product.md「画面構成」節（/login, /signup, /dashboard）
- docs/product.md「技術スタック」節（Supabase Auth）

## 目的
Supabase Authを使用したメールアドレス＋パスワード認証を実装する。ユーザーがサインアップ・ログイン・ログアウトでき、認証状態が永続化される。

## 範囲

### In scope
- `/login` ページ（ログインフォーム）
- `/signup` ページ（サインアップフォーム）
- ログアウト機能（ボタンコンポーネント）
- 認証状態の永続化（Supabase セッション管理）
- 認証ミドルウェア（middleware.ts）
  - 未認証ユーザーを `/login` へリダイレクト
  - 認証済みユーザーを `/dashboard` へリダイレクト（/login, /signup アクセス時）
- `/dashboard` ページ（プレースホルダー、認証後のリダイレクト先）
- 認証エラーハンドリング（無効なメール、パスワード不一致等）
- フォームバリデーション（クライアントサイド）

### Out of scope
- パスワードリセット機能
- ソーシャルログイン（Google, GitHub等）
- メール確認フロー（Supabaseのデフォルト設定を使用）
- ダッシュボードの実際のUI実装（PR#7）
- ユーザープロフィール編集

## 技術固定（変更禁止）
- Supabase Auth を使用すること（他の認証ライブラリ禁止）
- Server Actions または Route Handlers で認証処理
- フォームは shadcn/ui の Input, Button, Label を使用
- middleware.ts で認証チェック

## 受け入れ条件（AC）
- [ ] `/signup` でメール・パスワードを入力しアカウント作成できる
- [ ] `/login` でメール・パスワードを入力しログインできる
- [ ] ログイン後 `/dashboard` にリダイレクトされる
- [ ] ログアウトボタンをクリックするとログアウトし `/login` にリダイレクトされる
- [ ] 未認証で `/dashboard` にアクセスすると `/login` にリダイレクトされる
- [ ] 認証済みで `/login` `/signup` にアクセスすると `/dashboard` にリダイレクトされる
- [ ] ブラウザをリロードしても認証状態が維持される
- [ ] 無効な入力時にエラーメッセージが表示される

## 禁止事項
- Supabase Auth 以外の認証ライブラリの導入
- 認証情報のローカルストレージへの手動保存（Supabaseに任せる）
- パスワードの平文ログ出力
- DBスキーマの変更（PR#3で行う）
- スコープ外機能の先行実装

## 成果物
1. **コード:**
   - `/app/login/page.tsx`
   - `/app/signup/page.tsx`
   - `/app/dashboard/page.tsx`（プレースホルダー）
   - `/middleware.ts`
   - `/components/auth/login-form.tsx`
   - `/components/auth/signup-form.tsx`
   - `/components/auth/logout-button.tsx`
2. **PR要約:** 認証フローの説明、テスト手順

## 質問（最大3つ）
1. メール確認を必須にするか？（Supabase設定で制御。デフォルトは確認メール送信）
2. パスワードの最小文字数は？（デフォルト6文字を想定）
3. ログインエラー時のメッセージは日本語化するか？
