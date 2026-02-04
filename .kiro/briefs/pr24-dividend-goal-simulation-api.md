# PR#24: 配当ロードマップ基盤API（/api/simulations/dividend-goal）

## 目的
- 配当ロードマップの中核となる通常シミュレーションAPIを正式実装する。
- モック依存状態を解消し、本番環境でロードマップ機能を成立させる。

## 背景 / 狙い
- 現状、通常ロードマップ用 API `/api/simulations/dividend-goal` が未実装であり、UIはモック前提でのみ動作している。
- `/api/simulations/dividend-goal/shock` のみが存在する状態は構造的に不整合であり、基盤APIの完成が最優先である。
- 本PRで「通常 → ショック → 比較 → 課金」すべての土台を完成させる。

## スコープ

### In scope
- APIルート `/api/simulations/dividend-goal` の新規実装（POST）
- 通常ロードマップシミュレーション処理の実装
- 年次 series の生成
- 達成判定・ギャップ算出
- recommendations（感度分析2種）の生成
- PR18で定義したZodスキーマ・エラー形式への準拠
- UI（PR19）との本番接続確認

### Out of scope
- shockロジックの再設計（既存を流用）
- UI改修
- DB保存（PR22で対応）
- キャッシュ・最適化

## 技術固定（変更禁止）
- ZodをSSOTとする（Request/Response）
- エラーJSON形式を統一する
- 既存の配当計算ロジックは改変しない（再利用のみ）
- mockフラグ前提の実装は禁止（本番APIを正とする）

## 実装対象ファイル（想定）
- app/api/simulations/dividend-goal/route.ts
- lib/simulations/dividend-goal-sim.ts
- lib/simulations/roadmap.ts（必要に応じて整理）
- lib/api/simulations.ts（接続調整のみ）

## API仕様（要約）

### Endpoint
POST /api/simulations/dividend-goal

### 主な処理
1. 認証チェック
2. Zod validation
3. 現在の年間配当取得
4. 年次ループによる series 生成
5. 達成判定
6. recommendations 生成
7. Response返却

## 推奨ロジック（固定）
- 月次 +10,000円 影響
- 利回り +0.5% 影響
- 銘柄名・売買助言は出さない

## 受け入れ条件（AC）
- [ ] POST /api/simulations/dividend-goal が200を返す
- [ ] 本番envで404にならない
- [ ] mock OFF状態でPR19 UIが動作する
- [ ] series が1年以上分生成される
- [ ] achieved / achieved_in_year / gap_now が正しく返る
- [ ] recommendations が2件返る
- [ ] 401 / 400 / 500 が仕様通り返る
- [ ] shock API と前提条件を揃えた場合、base結果が一致する

## 移行方針
- NEXT_PUBLIC_ROADMAP_SIMULATION_MOCK は開発補助用途のみに限定する
- 本PRマージ後は mock=false を前提とする

## 禁止事項
- UI側で計算処理を追加すること
- shock API の独自ロジック化
- 配当予測・銘柄推奨につながる表現

## 質問
- なし
