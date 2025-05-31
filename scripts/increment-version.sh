#!/bin/bash
# scripts/increment-version.sh
# PHRApp バージョン自動インクリメントスクリプト

set -e # エラーがあれば停止

# package.jsonからバージョン番号を取得
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo "現在のバージョン: $CURRENT_VERSION"

# バージョンコンポーネントを分割（例: 1.0.0 -> [1, 0, 0]）
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# 引数に基づいてバージョンを更新
case "$1" in
  "major")
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  "minor")
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  "patch" | "")  # デフォルトはパッチバージョンを上げる
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "使用法: $0 [major|minor|patch]"
    exit 1
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "新バージョン: $NEW_VERSION"

# package.jsonの更新
npm version "$NEW_VERSION" --no-git-tag-version

# iOS Info.plistのバージョン更新
if [ -f "./ios/PHRApp/Info.plist" ]; then
  plutil -replace CFBundleShortVersionString -string "$NEW_VERSION" ./ios/PHRApp/Info.plist
  BUILD_NUMBER=$(plutil -extract CFBundleVersion xml1 -o - ./ios/PHRApp/Info.plist | sed -n "s/.*<string>\(.*\)<\/string>.*/\1/p")
  NEW_BUILD=$((BUILD_NUMBER + 1))
  plutil -replace CFBundleVersion -string "$NEW_BUILD" ./ios/PHRApp/Info.plist
  echo "iOS ビルド番号を $NEW_BUILD に更新しました"
fi

# Android build.gradleの更新
GRADLE_FILE="./android/app/build.gradle"
if [ -f "$GRADLE_FILE" ]; then
  # versionCodeを取得して増加
  VERSION_CODE=$(grep "versionCode " "$GRADLE_FILE" | awk '{print $2}' | tr -d '[:space:]')
  NEW_VERSION_CODE=$((VERSION_CODE + 1))
  
  # versionCode と versionName を更新
  sed -i '' "s/versionCode $VERSION_CODE/versionCode $NEW_VERSION_CODE/" "$GRADLE_FILE"
  sed -i '' "s/versionName \".*\"/versionName \"$NEW_VERSION\"/" "$GRADLE_FILE"
  
  echo "Android versionCode を $NEW_VERSION_CODE に更新しました"
fi

echo "バージョン更新完了！"
