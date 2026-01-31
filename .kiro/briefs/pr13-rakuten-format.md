# PR#13: 楽天証券フォーマット対応 - ヘッダー自動検出・マッピング

## 参照ドキュメント
- docs/product_phase2.md「F6: CSV一括インポート」節
- docs/product_phase2.md「対応フォーマット 楽天証券」（L39）

## 目的
楽天証券の保有商品一覧CSVフォーマットに対応する。
PR#12で実装したフォーマット検出ロジックを拡張する。

## 範囲

### In scope
- 楽天証券フォーマット定義（`lib/csv/formats/rakuten.ts`）
- ヘッダー行パターン追加（`lib/csv/detect-format.ts` 拡張）
- 楽天証券固有のカラムマッピング

### Out of scope
- 新規機能追加

## 技術固定（変更禁止）
- PR#9-12の実装パターン維持
- `lib/csv/detect-format.ts` のインターフェース維持

## 受け入れ条件（AC）
- [ ] `lib/csv/formats/rakuten.ts` に楽天証券フォーマットマッピング定義
- [ ] 楽天証券CSVのヘッダー行パターンを識別できる
- [ ] `lib/csv/detect-format.ts` が楽天証券フォーマットを検出
- [ ] 楽天証券CSVから `NewHolding[]` への変換が正しく動作
- [ ] UIで「楽天証券フォーマットを検出しました」と表示
- [ ] 楽天証券CSV（UTF-8想定）が正しくパースできる

## 禁止事項
- PR#9-12のコア実装変更
- 汎用/SBIフォーマットの挙動変更

## 成果物
1. **コード:**
   - `lib/csv/formats/rakuten.ts`
   - `lib/csv/detect-format.ts`（パターン追加）
   - `lib/csv/formats/index.ts`（エクスポート追加）
2. **PR要約:** 楽天証券CSVフォーマット対応。F6 CSV一括インポート機能完成。

## 質問（最大3つ）
1. 楽天証券CSVの実際のヘッダー行サンプルはありますか？（なければ一般的な形式を仮定）
