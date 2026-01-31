# PR#9: CSVパーサー基盤 - 汎用フォーマット対応

## 参照ドキュメント
- docs/product_phase2.md「F6: CSV一括インポート」節
- docs/product_phase2.md「汎用CSVフォーマット仕様」（L42-47）
- docs/product_phase2.md「テスト観点 F6」（L158-162）

## 目的
CSVファイルを解析し、銘柄データに変換する基盤ロジックを実装する。
汎用フォーマット（ユーザー手動作成CSV）に対応し、後続PRでSBI/楽天フォーマットを追加できる拡張性を持たせる。

## 範囲

### In scope
- CSVパーサーユーティリティ（`lib/csv/parser.ts`）
- 汎用フォーマット用マッピング定義（`lib/csv/formats/generic.ts`）
- CSVインポート用型定義（`lib/csv/types.ts`）
- バリデーションロジック（必須項目チェック、型変換、口座種別検証）
- エラーハンドリング（空行スキップ、不正フォーマット検出）
- UTF-8 BOM除去処理

### Out of scope
- UI実装（PR#10で対応）
- API実装（PR#11で対応）
- SBI証券フォーマット（PR#12で対応）
- 楽天証券フォーマット（PR#13で対応）
- 文字コード変換（Shift-JIS→UTF-8）（PR#12で対応）
- 重複チェックロジック（PR#11で対応）

## 技術固定（変更禁止）
- TypeScript strict mode
- 既存の型定義: `lib/holdings/types.ts` の `AccountType`, `NewHolding` を再利用
- ファイル配置: `lib/csv/` ディレクトリ配下
- 外部ライブラリ禁止（CSVパースは自前実装）

## 受け入れ条件（AC）
- [ ] `lib/csv/types.ts` に以下の型が定義されている
  - `CsvRow`: パース済み行データ
  - `CsvParseResult`: パース結果（成功行・エラー行）
  - `CsvFormat`: フォーマット種別（'generic' | 'sbi' | 'rakuten'）
  - `CsvValidationError`: バリデーションエラー詳細
- [ ] `lib/csv/parser.ts` が以下を実装している
  - `parseCsv(content: string, format: CsvFormat): CsvParseResult`
  - UTF-8 BOMを除去する
  - 空行をスキップする
  - ヘッダー行を除外する
  - 各行を `CsvRow` に変換する
- [ ] `lib/csv/formats/generic.ts` が汎用フォーマットのマッピングを定義
  - ヘッダー: `銘柄コード,銘柄名,保有株数,取得単価,口座種別`
  - `NewHolding` 型への変換関数 `mapToHolding(row: CsvRow): NewHolding`
- [ ] `lib/csv/validation.ts` が以下をバリデーション
  - 銘柄コード: 4桁数字（必須）
  - 銘柄名: 文字列（任意）
  - 保有株数: 正の整数（必須）
  - 取得単価: 正の数値（任意）
  - 口座種別: `AccountType` に含まれる値（必須）
- [ ] エラー行は `CsvValidationError` として行番号とエラー理由を保持
- [ ] 0件、1件、100件のCSVを正しくパースできる

## 禁止事項
- 既存コード（`lib/holdings/`, `lib/api/`, `components/`, `app/`）の変更
- 新規APIエンドポイントの追加
- UIコンポーネントの追加
- DBスキーマの変更
- 外部ライブラリの追加
- スコープ拡張（SBI/楽天フォーマット対応）

## 成果物
1. **コード:**
   - `lib/csv/types.ts`
   - `lib/csv/parser.ts`
   - `lib/csv/validation.ts`
   - `lib/csv/formats/generic.ts`
   - `lib/csv/formats/index.ts`（フォーマット切り替え用）
2. **PR要約:** CSVパース基盤を追加。汎用フォーマット対応。

## 質問（最大3つ）
なし
