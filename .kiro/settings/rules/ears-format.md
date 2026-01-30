# EARS形式ガイドライン

## 概要
EARS（Easy Approach to Requirements Syntax）は、仕様駆動開発における受け入れ基準の標準フォーマットです。

EARSパターンは要件の論理構造（条件 + 主語 + 応答）を記述し、特定の自然言語に縛られません。
すべての受け入れ基準は、仕様で設定されたターゲット言語（例: `spec.json.language` / `ja`）で記述する必要があります。
EARSのトリガーキーワードと固定フレーズは英語のまま（`When`, `If`, `While`, `Where`, `The system shall`, `The [system] shall`）にし、可変部分（`[event]`, `[precondition]`, `[trigger]`, `[feature is included]`, `[response/action]`）のみをターゲット言語にローカライズします。トリガーまたは固定英語フレーズ自体にターゲット言語のテキストを挿入しないでください。

## 主要なEARSパターン

### 1. イベント駆動要件
- **パターン**: When [event], the [system] shall [response/action]
- **ユースケース**: 特定のイベントまたはトリガーへの応答
- **例**: When ユーザーがチェックアウトボタンをクリックしたとき, the チェックアウトサービス shall カート内容を検証する

### 2. 状態駆動要件
- **パターン**: While [precondition], the [system] shall [response/action]
- **ユースケース**: システム状態または前提条件に依存する動作
- **例**: While 支払い処理中, the チェックアウトサービス shall ローディングインジケーターを表示する

### 3. 望ましくない動作要件
- **パターン**: If [trigger], the [system] shall [response/action]
- **ユースケース**: エラー、失敗、または望ましくない状況へのシステム応答
- **例**: If 無効なクレジットカード番号が入力されたとき, then the ウェブサイト shall エラーメッセージを表示する

### 4. オプション機能要件
- **パターン**: Where [feature is included], the [system] shall [response/action]
- **ユースケース**: オプションまたは条件付き機能の要件
- **例**: Where 車にサンルーフがある場合, the 車 shall サンルーフコントロールパネルを持つ

### 5. ユビキタス要件
- **パターン**: The [system] shall [response/action]
- **ユースケース**: 常にアクティブな要件と基本的なシステム特性
- **例**: The 携帯電話 shall 100グラム未満の質量を持つ

## 複合パターン
- While [precondition], when [event], the [system] shall [response/action]
- When [event] and [additional condition], the [system] shall [response/action]

## 主語選択ガイドライン
- **ソフトウェアプロジェクト**: 具体的なシステム/サービス名を使用（例: 「チェックアウトサービス」、「ユーザー認証モジュール」）
- **プロセス/ワークフロー**: 責任のあるチーム/役割を使用（例: 「サポートチーム」、「レビュープロセス」）
- **非ソフトウェア**: 適切な主語を使用（例: 「マーケティングキャンペーン」、「ドキュメント」）

## 品質基準
- 要件はテスト可能で、検証可能であり、単一の動作を記述する必要があります
- 客観的な言語を使用: 必須の動作には「shall」、推奨には「should」。曖昧な用語は避ける
- EARS構文に従う: [condition], the [system] shall [response/action]
