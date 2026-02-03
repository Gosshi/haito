# PR#18: 配当目標シミュレーションAPI - シリーズ生成 + 推奨（感度分析）

## 参照ドキュメント
- docs/product_phase2.md「F8: 目標設定と進捗表示」
- .kiro/briefs/pr14-goal-settings-api.md
- .kiro/briefs/pr16-goal-progress-widget.md

## 目的
年間配当の目標値に対して、将来の配当推移をシミュレーションするAPIを実装する。  
UIは後続PRで実装する前提で、APIレスポンスはグラフ描画に直結する形式とする。

## 範囲

### In scope
- POST /api/simulations/dividend-goal 追加
- 現在の年間配当額（税引前/後）を既存計算から算出して初期値に使用
- シミュレーションの年次 series（year -> annual_dividend 等）を生成
- 推奨（recommendations）として “感度分析” を2種類返す（銘柄推奨はしない）
  - 月次入金 +10,000 円の影響（達成年数の短縮）
  - 想定利回り +0.5% の影響（期末配当の増分）

### Out of scope
- UI（グラフ/入力フォーム）（後続PR）
- ストレステスト（減配ショック）（後続PR）
- シナリオ比較（安定/高配当/増配）（後続PR）
- シミュレーション結果のDB永続化（MVPでは保存しない）

## 技術固定（変更禁止）
- Supabase 認証・既存の server client 実装を使用
- 既存の年間配当計算ロジックを変更しない（lib/calculations/dividend.ts 等）
- 既存の user_settings テーブル構造は変更しない
- “推奨”は銘柄名を出さず、数値の差分（変化量）だけ返す

## 受け入れ条件（AC）
- [ ] POST /api/simulations/dividend-goal が実装されている
- [ ] 未認証は 401 を返す
- [ ] Request 例（※インデントで表現）:
    {
      "target_annual_dividend": 300000,
      "monthly_contribution": 50000,
      "horizon_years": 15,
      "assumptions": {
        "yield_rate": 0.04,
        "dividend_growth_rate": 0.02,
        "tax_mode": "pretax"
      }
    }

- [ ] Response が以下を含む
  - snapshot.current_annual_dividend
  - result.achieved / result.achieved_in_year / result.gap_now
  - series[]（year と annual_dividend は必須）
  - recommendations[]（2件、どちらも “差分” 指標）

- [ ] シミュレーション式（MVP近似）：
  - dividend[t+1] = dividend[t] * (1 + g) + (monthly*12) * y

- [ ] tax_mode が pretax のときは税引前配当、after_tax のときは税引後配当を基準にする
- [ ] バリデーション
  - target_annual_dividend >= 0
  - monthly_contribution >= 0
  - horizon_years は 1〜50
  - yield_rate は 0〜0.2
  - dividend_growth_rate は -0.2〜0.2
- [ ] 型定義を追加する（Request/Response）

## 禁止事項
- 「この銘柄を買え」など銘柄推奨の実装
- UIの追加
- 既存配当計算ロジックの改変
- DBスキーマ変更

## 成果物
1. コード:
   - app/api/simulations/dividend-goal/route.ts
   - lib/calculations/dividend-goal-sim.ts
   - lib/simulations/types.ts（Request/Response型）
2. PR要約:
   - 配当目標シミュレーションAPI追加。series + 感度分析推奨（差分）を返す。

## 質問（最大3つ）
- なし

# 追加指示（重要：実装ブレ防止）

## 型・バリデーション方針
- Request/Response の型は **方針A**：**Zodスキーマを唯一の真実（SSOT）**として実装すること。
  - `z.object(...)` で **入力バリデーション**を定義する。
  - `z.infer<typeof Schema>` を用いて **TypeScript型を生成**する。
  - APIルートでは `safeParse` を使用する。

- 型/スキーマの配置ルール：
  - `lib/simulations/types.ts` に以下を定義する。
    - `DividendGoalRequestSchema`
    - `DividendGoalResponseSchema`
  - 型は次の形式で export する。
    - `export type DividendGoalRequest = z.infer<typeof DividendGoalRequestSchema>`
    - `export type DividendGoalResponse = z.infer<typeof DividendGoalResponseSchema>`

## エラーJSON形式（全API共通・固定）
- エラー時のレスポンス形式は **必ず以下に統一**する。

    {
      "error": {
        "code": "<STRING_CODE>",
        "message": "<ユーザー向けの簡潔な説明>",
        "details": <ZodError や補足情報 | null>
      }
    }

- ステータスコードの使い分け：
  - **401 Unauthorized**
    - 認証されていない場合
    - code: "UNAUTHORIZED"
  - **400 Bad Request**
    - Zod バリデーション失敗
    - code: "INVALID_REQUEST"
    - details に ZodError を含める
  - **500 Internal Server Error**
    - 想定外エラー
    - code: "INTERNAL_ERROR"
    - details は null でよい

## 実装上の制約
- 既存の配当計算ロジック（`lib/calculations/dividend.ts` 等）は改変しない。
- “推奨（recommendations）” は銘柄名を出さず、**数値の差分（変化量）のみ**を返す。
- UI・DBスキーマ変更はこのPRでは行わない。