#!/bin/bash
# Setup git hooks for the repository
# Run this after cloning the repository

cd "$(git rev-parse --show-toplevel)" || exit 1

echo "Setting up git hooks..."

mkdir -p .git/hooks
ln -sf ../../scripts/pre-commit .git/hooks/pre-commit

echo "Git hooks configured successfully!"
echo "Pre-commit hook: scripts/pre-commit -> scripts/pre-commit.ts"
