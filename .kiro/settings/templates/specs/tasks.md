# 実装計画

## タスクフォーマットテンプレート

作業分解に合ったパターンを使用する:

### メジャータスクのみ
- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}} *(詳細が必要な場合のみ含める。タスクが単独で成立する場合は箇条書きを省略。)*
  - _Requirements: {{REQUIREMENT_IDS}}_

### メジャー + サブタスク構造
- [ ] {{MAJOR_NUMBER}}. {{MAJOR_TASK_SUMMARY}}
- [ ] {{MAJOR_NUMBER}}.{{SUB_NUMBER}} {{SUB_TASK_DESCRIPTION}}{{SUB_PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}}
  - {{DETAIL_ITEM_2}}
  - _Requirements: {{REQUIREMENT_IDS}}_ *(IDのみ。説明や括弧を追加しない。)*

> **並列マーカー**: 並列実行できるタスクにのみ` (P)`を追加する。`--sequential`モードで実行する場合はマーカーを省略する。
>
> **オプションのテストカバレッジ**: サブタスクが受け入れ基準に紐づく延期可能なテスト作業の場合、チェックボックスを`- [ ]*`としてマークし、詳細箇条書きで参照する要件を説明する。
