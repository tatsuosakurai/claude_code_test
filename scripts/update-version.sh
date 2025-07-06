#!/bin/bash

# バージョン情報を自動更新するスクリプト

# 現在のコミットハッシュを取得（短縮版）
COMMIT_HASH=$(git rev-parse --short HEAD)

# 現在の日時を取得（日本時間）
BUILD_TIME=$(TZ=Asia/Tokyo date +'%Y.%m.%d-%H%M')

# タイムスタンプ（UTC）
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# バージョンファイルのパス
VERSION_FILE="HIIT_exercise_time_keeper/version.js"

# バージョンファイルを更新
cat > "$VERSION_FILE" << EOF
// バージョン情報を動的に設定
window.APP_VERSION = {
    build: '${BUILD_TIME}-${COMMIT_HASH}',
    timestamp: '${TIMESTAMP}'
};
EOF

echo "Version updated: ${BUILD_TIME}-${COMMIT_HASH}"