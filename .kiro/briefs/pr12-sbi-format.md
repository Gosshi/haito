# PR#12: SBI証券フォーマット対応 - ヘッダー自動検出・Shift-JIS変換

## 参照ドキュメント
- docs/product_phase2.md「F6: CSV一括インポート」節
- docs/product_phase2.md「対応フォーマット SBI証券」（L38）
- docs/product_phase2.md「注意事項」（L152）

## 目的
SBI証券の保有証券一覧CSVフォーマットに対応する。
Shift-JIS文字コード変換とヘッダー自動検出を実装する。

## 範囲

### In scope
- SBI証券フォーマット定義（`lib/csv/formats/sbi.ts`）
- Shift-JIS → UTF-8 文字コード変換
- ヘッダー行からのフォーマット自動検出ロジック
- フォーマット検出関数（`lib/csv/detect-format.ts`）
- UIでのフォーマット自動検出表示

### Out of scope
- 楽天証券フォーマット（PR#13で対応）

## 技術固定（変更禁止）
- PR#9の `lib/csv/parser.ts` インターフェース維持
- 文字コード変換: `TextDecoder` API使用（外部ライブラリ禁止）

## 受け入れ条件（AC）
- [ ] `lib/csv/formats/sbi.ts` にSBI証券フォーマットマッピング定義
- [ ] SBI証券CSVのヘッダー行パターンを識別できる
- [ ] Shift-JISエンコードのCSVを正しくUTF-8に変換
- [ ] `lib/csv/detect-format.ts` でヘッダー行からフォーマット自動検出
- [ ] 検出結果: `'generic'` | `'sbi'` | `'rakuten'` | `'unknown'`
- [ ] UIで検出されたフォーマット名を表示（例: 「SBI証券フォーマットを検出しました」）
- [ ] SBI証券CSVから `NewHolding[]` への変換が正しく動作
- [ ] 文字化けなくパースできる（日本語銘柄名）

## 禁止事項
- 外部ライブラリ追加（iconv-lite等）
- PR#9-11のコア実装変更
- 汎用フォーマットの挙動変更

## 成果物
1. **コード:**
   - `lib/csv/formats/sbi.ts`
   - `lib/csv/detect-format.ts`
   - `lib/csv/encoding.ts`（文字コード変換）
   - `components/csv/format-badge.tsx`
2. **PR要約:** SBI証券CSVフォーマット対応。Shift-JIS変換・自動検出。

## 質問（最大3つ）
1. SBI証券CSVの実際のヘッダー行サンプルはありますか？（なければ一般的な形式を仮定）
