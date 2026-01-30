# 設計（Design）

> このファイルは要件レビュー後の「設計フェーズ」で作成・更新されます。  
> 実装担当（Codex）は **本ファイルの内容を前提として実装のみを行い、再設計してはいけません。**

---

## 1. 設計方針（Overview）

- 本PR / 本フェーズにおける設計の目的と考え方を簡潔に記載する
- 上流（ClaudeCode）で確定した判断のみを書く

---

## 2. 対象範囲（Scope）

### 対象（In Scope）
- {{design_in_scope}}

### 対象外（Out of Scope）
- {{design_out_of_scope}}

---

## 3. アーキテクチャ概要

### フロントエンド
- フレームワーク: {{frontend_framework}}
- ルーティング方式: {{routing}}
- 状態管理: {{state_management}}
- UI構成方針: {{ui_policy}}

### バックエンド / BaaS
- 認証方式: {{auth_method}}
- データストア: {{database}}
- 権限管理: {{authorization}}

---

## 4. データ設計（必要な場合）

> ※ DBスキーマが変更されない場合は「変更なし」と明記する

- 使用テーブル:
  - {{tables}}
- 主キー / 制約:
  - {{constraints}}
- 注意点:
  - {{data_notes}}

---

## 5. 画面・UI設計（簡易）

> 詳細なUIデザインは不要。構造と責務のみを書く。

- ページ一覧:
  - {{pages}}
- 各ページの責務:
  - {{page_responsibilities}}

---

## 6. 認証・認可・セキュリティ

- 認証状態の扱い:
  - {{auth_state_handling}}
- ガード方式:
  - {{route_guard}}
- セキュリティ上の注意:
  - {{security_notes}}

---

## 7. エラーハンドリング・例外

- 想定エラー:
  - {{error_cases}}
- 方針:
  - {{error_policy}}

---

## 8. 実装上の制約・注意事項（重要）

- 再設計禁止事項:
  - {{no_redesign_rules}}
- 実装者が守るべきルール:
  - {{implementation_rules}}

---

## 9. 未決事項（次フェーズ以降）

> このフェーズでは解決しない事項を明示する

- {{open_issues}}

---

## 10. 実装者への指示（Codex向け）

- 本設計は **確定事項**であり、実装者は変更してはいけない
- 不明点は最大3つまで質問可
- それ以外は合理的に仮定して実装を進める
