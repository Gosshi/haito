# PR#6: 配当データ自動取得（Yahoo Finance）

## 参照ドキュメント
- docs/product.md「F3: 配当データ自動取得」節
- docs/product.md「技術スタック」節（Yahoo Finance API / スクレイピング）
- docs/product.md「データベーススキーマ」節（dividend_data テーブル）

## 目的
銘柄コードから年間配当金（予想）と配当月を自動取得し、dividend_dataテーブルにキャッシュする。ユーザーが手動で配当情報を入力する必要をなくす。

## 範囲

### In scope
- Yahoo Finance からの配当データ取得
  - 年間配当金（1株あたり、予想）
  - 配当利回り
  - 権利確定月（ex_dividend_months）
  - 配当支払月（payment_months）
  - 銘柄名
- API Route の作成（`/api/dividends/fetch`）
  - 銘柄コードを受け取り、Yahoo Finance から取得
  - dividend_data テーブルへ upsert
- 手動更新ボタン
  - 銘柄一覧またはダッシュボードに設置
  - クリックで保有銘柄全ての配当データを再取得
- 銘柄登録時の自動取得
  - PR#4の銘柄追加フォームにフック
  - 銘柄コード入力後に銘柄名を自動補完
- データ取得のローディング状態表示
- エラーハンドリング（銘柄が見つからない場合等）

### Out of scope
- 1日1回の自動バッチ更新（Cron）
- 複数の外部APIソースへのフォールバック
- 配当データの履歴管理
- リアルタイム株価取得

## 技術固定（変更禁止）
- データソース: Yahoo Finance（日本株）
- API Route: Next.js Route Handlers（/api/）
- dividend_data テーブルスキーマは変更禁止
- サーバーサイドでのみ外部API呼び出し（クライアント直接呼び出し禁止）

## 受け入れ条件（AC）
- [ ] `/api/dividends/fetch?code=8306` で三菱UFJの配当データが取得できる
- [ ] 取得データが dividend_data テーブルに保存される
- [ ] 同一銘柄の再取得時、既存レコードが更新される（upsert）
- [ ] 銘柄追加フォームで銘柄コード入力後、銘柄名が自動補完される
- [ ] 手動更新ボタンをクリックすると、保有銘柄全ての配当データが更新される
- [ ] データ取得中はローディングインジケーターが表示される
- [ ] 存在しない銘柄コードの場合、適切なエラーメッセージが表示される
- [ ] 取得した配当データ（年間配当、配当利回り、配当月）が正しく保存される

## 禁止事項
- dividend_data テーブルスキーマの変更
- クライアントサイドからの直接外部API呼び出し
- APIキーのハードコーディング（環境変数使用）
- 過度なAPI呼び出し（レートリミット考慮）

## 成果物
1. **コード:**
   - `/app/api/dividends/fetch/route.ts`
   - `/lib/external/yahoo-finance.ts`（Yahoo Finance クライアント）
   - `/lib/api/dividends.ts`（dividend_data 操作関数）
   - `/components/portfolio/refresh-dividends-button.tsx`
   - `/components/portfolio/add-holding-form.tsx`（銘柄名自動補完追加）
2. **PR要約:** 外部API連携の説明、取得データのマッピング仕様

## 質問（最大3つ）
1. Yahoo Finance API は直接利用か、ラッパーライブラリ（yahoo-finance2等）を使用するか？
2. 配当データが取得できない銘柄（ETF等）の扱いは？（null許容 or エラー）
3. API呼び出しのレートリミット対策（遅延挿入等）は必要か？
