---
name: codex
description: |
  Codex CLI（OpenAI）を使用して、src/ディレクトリ内のコード実装・レビュー・分析を行う外部ツール。
  Claude Code（設計者）の手足となり、具体的な実装作業を担当する。
  トリガー: "codex", "codexで実装", "実装して", "レビューして"
---

# Codex Executor Skill

## 概要
このスキルは、OpenAI CodexモデルをCLI経由で呼び出し、プロジェクト内のコード操作を実行します。
すべての操作は `--full-auto` モードで行われ、人間の介入なしに完結することを前提としています。

## 実行コマンド構成

### A. 実装・修正モード (書き込み許可)
`codex exec --full-auto --cd src/ "<request>"`

### B. 分析・相談モード (読み取り専用・安全)
`codex exec --full-auto --sandbox read-only --cd src/ "<request>"`

## プロンプトの絶対ルール (Implementation Rules)

**重要**: Codexに渡す `<request>` 文字列の末尾には、以下の「実装ガイドライン」を**必ず**含めてください。

> **【実装ガイドライン (厳守)】**
> 1. **省略禁止**: `// TODO`, `pass`, `Implementation here...` 等のプレースホルダーは使用禁止。必ず動作するコードを最後まで書ききること。
> 2. **自己完結**: 未定義の関数や変数が残らないよう、必要なインポート文やヘルパー関数も同時に実装すること。
> 3. **既存踏襲**: プロジェクト内の既存の命名規則、ディレクトリ構成、コードスタイル（Linter設定など）に合わせること。
> 4. **型安全性**: TypeScript等の場合、`any` 型の使用を避け、適切な型定義を行うこと。
> 5. **確認不要**: 質問は一切せず、最善と判断した実装を適用し、変更箇所を簡潔に報告すること。

## ユースケース (Few-Shot Examples)

### ケース1: 新規機能実装 (Implement)
**User**: "src/api にログイン機能を追加して"
**Command**:
codex exec --full-auto --cd src/ "api/auth.ts を作成し、JWTを使用したログイン処理関数を実装してください。バリデーションにはZodを使用し、エラーハンドリングを含めて完結させてください。【実装ガイドラインを厳守すること】"

### ケース2: 既存改修 & テスト (Fix & Test)
**User**: "決済処理のバグを直してテストも書いて"
**Command**:
codex exec --full-auto --cd src/ "payment/service.ts の二重課金バグを修正し、対応する単体テストを payment/service.test.ts に追加してください。モックデータを使用してテストが通る状態にすること。【実装ガイドラインを厳守すること】"

### ケース3: コードレビュー (Review)
**User**: "今のコードの品質をチェックして"
**Command**:
codex exec --full-auto --sandbox read-only --cd src/ "現在のコードベースをレビューし、セキュリティリスクやパフォーマンスの懸念点を指摘してください。確認不要、具体的な修正コード案まで提示してください。"

### ケース4: UI/UXデザイン (Design)
**User**: "ボタンのデザインを改善して"
**Command**:
codex exec --full-auto --cd src/ "components/Button.tsx のUIを評価・改善してください。(1)視覚的階層、(2)アクセシビリティ(WAI-ARIA)、(3)インタラクションの一貫性を考慮すること。Tailwind CSSを用いた改善コードを適用してください。【実装ガイドラインを厳守すること】"
