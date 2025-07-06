#!/bin/bash

# Git hooksのセットアップスクリプト

echo "Setting up Git hooks..."

# プロジェクトルートディレクトリに移動
cd "$(git rev-parse --show-toplevel)"

# Gitにカスタムフックディレクトリを設定
git config core.hooksPath .githooks

echo "Git hooks setup completed!"
echo "Now version.js will be automatically updated on each commit."