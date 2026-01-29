#!/usr/bin/env bash
set -euo pipefail

# kiro-bootstrap.sh
# 目的:
#   - 共通テンプレを ~/dotfiles/kiro/ に作成（初回のみ）
#   - 各リポジトリに .kiro/settings/steering.md と .kiro/templates/impl-brief.md を symlink で配置
#
# 使い方:
#   1) 任意の場所に保存して実行権限付与:
#        chmod +x kiro-bootstrap.sh
#   2) 対象リポジトリのルートで実行:
#        ./kiro-bootstrap.sh
#
# オプション:
#   --dotfiles-dir <path>  : 共通テンプレの置き場（デフォルト: ~/dotfiles/kiro）
#   --copy                 : symlink ではなくコピーする（CIや配布向け）
#   --force                : 既存ファイル/リンクがあれば上書き
#   --repo-dir <path>      : リポジトリルート（デフォルト: カレントディレクトリ）

DOTFILES_DIR="${HOME}/dotfiles/kiro"
REPO_DIR="$(pwd)"
MODE="symlink" # or "copy"
FORCE="false"

usage() {
  cat <<'USAGE'
Usage: kiro-bootstrap.sh [options]

Options:
  --dotfiles-dir <path>   Location to store shared templates (default: ~/dotfiles/kiro)
  --repo-dir <path>       Repo root to install into (default: current directory)
  --copy                  Copy files instead of symlinking
  --force                 Overwrite existing files/links
  -h, --help              Show this help

Examples:
  ./kiro-bootstrap.sh
  ./kiro-bootstrap.sh --repo-dir ~/work/my-repo --force
  ./kiro-bootstrap.sh --copy
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dotfiles-dir)
      DOTFILES_DIR="$2"; shift 2;;
    --repo-dir)
      REPO_DIR="$2"; shift 2;;
    --copy)
      MODE="copy"; shift;;
    --force)
      FORCE="true"; shift;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1;;
  esac
done

mkdir -p "${DOTFILES_DIR}"

STEERING_SRC="${DOTFILES_DIR}/steering.md"
IMPL_BRIEF_SRC="${DOTFILES_DIR}/impl-brief.md"

# ---- Create shared templates if missing (or overwrite with --force) ----
write_file() {
  local path="$1"
  local content="$2"

  if [[ -e "$path" && "$FORCE" != "true" ]]; then
    echo "Kept existing: $path"
    return 0
  fi

  cat > "$path" <<EOF
${content}
EOF
  echo "Wrote: $path"
}

STEERING_CONTENT=$'# 役割定義\nこのエージェントは「実装担当」です。\n設計者・アーキテクトとして振る舞ってはいけません。\n\n# 設計権限\nDB設計、API設計、仕様、受け入れ条件はすべて上流（ClaudeCode）で確定済みです。\n再設計・仕様変更・スコープ拡張は禁止です。\n\n# 実装ルール\n- 既存コードの設計・パターン・命名規則に必ず従う\n- 最小差分（minimal diff）で実装する\n- 必要なテストを追加・更新する\n- lint / formatter / CI が通る状態で完了とする\n\n# 不明点の扱い\n- 確認質問は最大3つまで\n- それ以外は合理的に仮定して実装を進める\n\n# 成果物\n- 実装コード\n- テスト\n- 変更点の要約（PRに貼れる形）\n'

IMPL_BRIEF_CONTENT=$'以下は「設計がすでに完了している機能」の実装指示です。\n設計判断はすべて上流（ClaudeCode）で確定しています。\n\n【禁止事項】\n- 再設計しない\n- API仕様・DB構造を変更しない\n- スコープを広げない\n\n【実装タスク概要】\n- 機能名: {{FEATURE_NAME}}\n- 対象: {{TARGET}}\n- 実装内容:\n{{DESIGN_SUMMARY}}\n\n【受け入れ条件】\n{{ACCEPTANCE_CRITERIA}}\n\n【完了条件】\n- 実装完了\n- テスト追加\n- lint / CI が通過\n'

write_file "${STEERING_SRC}" "${STEERING_CONTENT}"
write_file "${IMPL_BRIEF_SRC}" "${IMPL_BRIEF_CONTENT}"

# ---- Install into repo ----
KIRO_SETTINGS_DIR="${REPO_DIR}/.kiro/settings"
KIRO_TEMPLATES_DIR="${REPO_DIR}/.kiro/templates"
mkdir -p "${KIRO_SETTINGS_DIR}" "${KIRO_TEMPLATES_DIR}"

STEERING_DST="${KIRO_SETTINGS_DIR}/steering.md"
IMPL_BRIEF_DST="${KIRO_TEMPLATES_DIR}/impl-brief.md"

install_one() {
  local src="$1"
  local dst="$2"

  if [[ -e "$dst" || -L "$dst" ]]; then
    if [[ "$FORCE" == "true" ]]; then
      rm -f "$dst"
    else
      echo "Skip (exists): $dst"
      return 0
    fi
  fi

  if [[ "$MODE" == "copy" ]]; then
    cp -p "$src" "$dst"
    echo "Copied: $dst"
  else
    ln -s "$src" "$dst"
    echo "Linked: $dst -> $src"
  fi
}

install_one "${STEERING_SRC}" "${STEERING_DST}"
install_one "${IMPL_BRIEF_SRC}" "${IMPL_BRIEF_DST}"

cat <<EOF

✅ Done.

Shared templates:
  - ${STEERING_SRC}
  - ${IMPL_BRIEF_SRC}

Installed into repo (${REPO_DIR}):
  - ${STEERING_DST}
  - ${IMPL_BRIEF_DST}

Next recommended steps (Codex CLI):
  1) /prompts:kiro-steering        (内容は steering.md が基準になる想定)
  2) /prompts:kiro-spec-init       (impl-brief.md を埋めて渡す運用)

Tip:
  - 複数リポジトリで使う場合は、それぞれの repo ルートでこのスクリプトを実行してください。
EOF
