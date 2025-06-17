#!/bin/bash

# Check if we have any changes to commit
if [[ -z $(git status --porcelain) ]]; then
    echo "No changes to commit"
    exit 0
fi

# Show the diff
echo "=== Git Diff ==="
git diff --cached
git diff

# Stage all changes if not already staged
echo -e "\n=== Staging changes ==="
git add -A

# Show what will be committed
echo -e "\n=== Changes to be committed ==="
git diff --cached --stat

# Generate commit message using git diff
echo -e "\n=== Generating commit message ==="
COMMIT_MSG=$(git diff --cached --name-only | head -5 | xargs -I {} basename {} | paste -sd ", " | sed 's/,/, /g')
COMMIT_MSG="Update: $COMMIT_MSG"

# Show the generated commit message
echo "Generated commit message: $COMMIT_MSG"
echo -n "Use this message? (y/n/edit): "
read response

if [[ "$response" == "edit" || "$response" == "e" ]]; then
    echo "Enter your commit message:"
    read -r COMMIT_MSG
elif [[ "$response" != "y" && "$response" != "yes" ]]; then
    echo "Commit cancelled"
    exit 0
fi

# Commit with the message
echo -e "\n=== Committing ==="
git commit -m "$COMMIT_MSG

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Push to remote
echo -e "\n=== Pushing to remote ==="
git push -u origin "$CURRENT_BRANCH"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Install it to create PR comments."
    echo "Visit: https://cli.github.com/"
    exit 0
fi

# Check if PR exists
PR_NUMBER=$(gh pr view --json number -q .number 2>/dev/null)

if [[ -z "$PR_NUMBER" ]]; then
    echo -e "\n=== Creating PR ==="
    echo "Enter PR title (or press Enter to use commit message):"
    read -r PR_TITLE
    if [[ -z "$PR_TITLE" ]]; then
        PR_TITLE="$COMMIT_MSG"
    fi
    
    echo "Enter PR description:"
    read -r PR_BODY
    
    gh pr create --title "$PR_TITLE" --body "$PR_BODY

🤖 Generated with Claude Code"
else
    echo -e "\n=== Adding comment to PR #$PR_NUMBER ==="
    echo "Enter comment for PR:"
    read -r PR_COMMENT
    
    gh pr comment "$PR_NUMBER" --body "$PR_COMMENT

🤖 Generated with Claude Code"
fi

echo -e "\n✅ All done!"