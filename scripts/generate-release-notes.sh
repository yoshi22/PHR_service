#!/bin/bash
# scripts/generate-release-notes.sh
# PHRApp リリースノート生成スクリプト

set -e # エラーがあれば停止

RELEASE_VERSION="$1"
OUTPUT_FILE="./release-notes/RELEASE_$RELEASE_VERSION.md"
TEMP_COMMITS="/tmp/phrapp_commits.txt"

if [ -z "$RELEASE_VERSION" ]; then
  # バージョン未指定の場合はpackage.jsonから取得
  RELEASE_VERSION=$(node -p "require('./package.json').version")
fi

echo "PHRApp バージョン $RELEASE_VERSION のリリースノートを生成します..."

# 出力先ディレクトリの確認
mkdir -p $(dirname "$OUTPUT_FILE")

# 前回のタグを取得（なければHEAD~50）
PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~50")

# コミットログの取得
git log "$PREV_TAG"..HEAD --pretty=format:"%h %s" > "$TEMP_COMMITS"

# カテゴリごとにコミットを分類
FEATURES=$(grep -i '\(feat\|feature\|add\)' "$TEMP_COMMITS" || true)
FIXES=$(grep -i '\(fix\|bug\|issue\)' "$TEMP_COMMITS" || true)
IMPROVEMENTS=$(grep -i '\(improve\|enhance\|refactor\|perf\)' "$TEMP_COMMITS" || true)
OTHER=$(grep -v -i '\(feat\|feature\|add\|fix\|bug\|issue\|improve\|enhance\|refactor\|perf\)' "$TEMP_COMMITS" || true)

# リリースノートの作成
cat > "$OUTPUT_FILE" << EOL
# PHRApp リリースノート - バージョン $RELEASE_VERSION

*リリース日: $(date '+%Y年%m月%d日')*

## 新機能 🎉

EOL

if [ -n "$FEATURES" ]; then
  echo "$FEATURES" | sed 's/^/- /' >> "$OUTPUT_FILE"
else
  echo "- 新機能の追加はありません" >> "$OUTPUT_FILE"
fi

cat >> "$OUTPUT_FILE" << EOL

## バグ修正 🐛

EOL

if [ -n "$FIXES" ]; then
  echo "$FIXES" | sed 's/^/- /' >> "$OUTPUT_FILE"
else
  echo "- バグ修正はありません" >> "$OUTPUT_FILE"
fi

cat >> "$OUTPUT_FILE" << EOL

## 改善点 ⚡️

EOL

if [ -n "$IMPROVEMENTS" ]; then
  echo "$IMPROVEMENTS" | sed 's/^/- /' >> "$OUTPUT_FILE"
else
  echo "- パフォーマンス改善はありません" >> "$OUTPUT_FILE"
fi

if [ -n "$OTHER" ]; then
  cat >> "$OUTPUT_FILE" << EOL

## その他の変更 🔧

EOL
  echo "$OTHER" | sed 's/^/- /' >> "$OUTPUT_FILE"
fi

cat >> "$OUTPUT_FILE" << EOL

## フィードバック

アプリについてのフィードバックやバグ報告は、アプリ内のフィードバックフォームからお願いします。
または、直接 support@phrapp.example.com までメールでお知らせください。

EOL

echo "リリースノートを $OUTPUT_FILE に生成しました。"

# 一時ファイルの削除
rm "$TEMP_COMMITS"
