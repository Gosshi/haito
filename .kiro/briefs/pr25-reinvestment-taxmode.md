# PR#25: 配当再投資 + 税区分（NISA/課税）対応（shock永続仕様固定）

対象PRの brief を .kiro/briefs/ に作成済み。  
brief の「技術固定」「禁止事項」「AC」を最優先して、要件→設計→タスクを生成して。  
スコープ外の提案やファイル追加はしない。必要なら質問は最大3つまで。

## 目的
- 配当シミュレーションに「再投資（複利）」の概念を正式に導入する。
- 税区分を **NISA（非課税） / 課税口座** で切り替え可能にし、より現実に寄せた試算を提供する。
- Freeは「再投資100% + 税区分=NISA」をデフォルト固定とし、Proで「再投資率可変 + 税区分切替」を提供する基盤を整備する。
- 既存の `/api/simulations/dividend-goal/shock` の仕様・互換性を壊さずに拡張する。

## 前提（現行APIスキーマ）
`/api/simulations/dividend-goal/shock` のリクエスト（DividendGoalShockRequest）は以下：
- top-level: target_annual_dividend / monthly_contribution / horizon_years / assumptions / shock
- assumptions: yield_rate / dividend_growth_rate / tax_mode（pretax|after_tax）
- shock: year / rate

本PRでは assumptions に新フィールドを **追加**する（既存フィールドの意味変更は禁止）。

## スコープ

### In scope
- 再投資モデル導入（資産 `capital` を持つ年次モデル）
- `assumptions` へのフィールド追加（後方互換を保つ）
  - `reinvest_rate`: 0.0〜1.0（再投資率）
  - `account_type`: "nisa" | "taxable"（計算用の税区分）
- Free/Pro制御（API側）
  - Free：reinvest_rate は常に 1.0、account_type は常に "nisa" に丸める
  - Pro：指定値を反映（未指定はデフォルト）
- 税率は固定値近似で計算（モデル仕様に従う）
- `/api/simulations/dividend-goal`（通常）と `/api/simulations/dividend-goal/shock`（ショック）で assumptions の共通化・整合を取る
- 既存UI（配当ロードマップ等）が破綻しないことを確認する（mock不要で動作すること）

### Out of scope
- NISA枠上限（年間/生涯）や枠消費を考慮した厳密計算
- NISA＋課税の混在（ポートフォリオ分割）
- 株価変動モデル、手数料、銘柄別戦略、最適化/推奨
- UIの大幅改修（最小限の入力/ロック表示のみ）

## 技術固定（変更禁止）

### 型・検証
- ZodスキーマをSSOTとする（Request/Response）。
- `assumptions.tax_mode` は現行の `pretax | after_tax` を維持する（意味変更禁止）。
- 税区分（NISA/課税）は `assumptions.account_type` として **別フィールド**で追加する（tax_modeで代用しない）。

### Free/Pro制御
- Free/Proの制御は **必ずAPI側**で行う（UIだけで制御しない）。
- Freeは `reinvest_rate=1.0` と `account_type="nisa"` に **丸める**（403で拒否しない）。
- Proは指定値を反映（未指定はデフォルト：reinvest_rate=1.0 / account_type="nisa"）。

### 税計算
- 税率は `account_type` で決める（計算用）。
  - nisa: tax_rate=0.0
  - taxable: tax_rate=0.20315（固定近似）
- 再投資に回る金額は必ず「税引後配当」を用いる：
  - reinvested = dividend * reinvest_rate * (1 - tax_rate)

### shock仕様（固定：永続影響）
- shockは「一時的」ではなく「永続影響型」とする。
- 指定 year に発生した減配は、その年以降すべての年に影響する。
- 回復・リバウンド・平均化などの補正は禁止。

適用ルール（概念）：
- t >= shock.year の場合、effective_yield[t] に (1 - shock.rate) を1回適用し、その後の年もその低下した水準を基準として推移する。

## モデル仕様（固定：年次MVP近似）
- capital[t]: 年初時点の投資元本
- dividend[t]: 年間配当（試算）
- annual_contribution = monthly_contribution * 12

計算（概念）：
1) tax_rate を account_type から決定
2) reinvested = dividend[t] * reinvest_rate * (1 - tax_rate)
3) capital[t+1] = capital[t] + annual_contribution + reinvested
4) effective_yield[t+1] = effective_yield[t] * (1 + dividend_growth_rate)
5) shockがある場合は「永続」ルールで effective_yield を減衰
6) dividend[t+1] = capital[t+1] * effective_yield[t+1]

※ 表示（pretax/after_tax）に tax_mode を使うことは可。ただし計算の税率決定は account_type を正とする。

## API変更（要点）

### Request（assumptions拡張）
- assumptions.reinvest_rate?: number（0.0〜1.0、未指定は1.0）
- assumptions.account_type?: "nisa" | "taxable"（未指定は"nisa"）

### バリデーション
- reinvest_rate が範囲外、account_type が不正なら 400（INVALID_REQUEST）

## UI連携（最小）
- Free:
  - 再投資：100%固定（変更UIはロック可）
  - 税区分：NISA固定（変更UIはロック可）
- Pro:
  - 再投資率変更（スライダー/数値入力）
  - 税区分切替（NISA/課税）
- UI文言は中立（投資助言禁止）。「試算」「前提」「配当の使い道」を用いる。

## UIコピー（固定）
- セクション名：再投資（配当の使い道）
- 税区分：税区分（NISA/課税）
- Free注記：
  - Freeでは再投資は100%・税区分はNISA固定で試算します
- 注意文：
  - 税率は簡易的に固定値で計算しています。入力前提に基づく試算です。

## 受け入れ条件（AC）
- [ ] `assumptions.reinvest_rate` と `assumptions.account_type` がZodで検証され、未指定時は default が適用される
- [ ] reinvest_rate=1.0, account_type=nisa で複利効果が series に反映される
- [ ] reinvest_rate=0.0, account_type=nisa で再投資なし挙動に近づく
- [ ] account_type=taxable で再投資に税が反映され、結果が変化する
- [ ] Freeユーザーは指定値が丸められる（1.0 / nisa）
- [ ] Proユーザーは指定値が反映される
- [ ] shockは永続仕様で適用され、t>=shock.year で以後の年も影響が残る
- [ ] 本番環境でmock不要で動作する
- [ ] 既存UI（ロードマップ/ショック）が破綻しない

## 禁止事項
- 「再投資すれば儲かる」等の誤解を生む表現、将来保証・断定表現
- UI側で独自計算を行うこと（計算はAPI/ロジック側）
- shockの一時化、回復補正、平均化

## 質問（最大3つ）
- なし
