#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 OSIRIS: Automatic Git & GitHub Publisher"
echo "Author: Nicholas Marnocha (@Frogman2745)"
echo "Target Repo: https://github.com/Frogman2745/osiris-tactical-radar.git"
echo "=========================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
  echo "📦 Initializing local Git repository (branch: main)..."
  git init -b main
else
  echo "ℹ️ Git repository already initialized."
fi

# Stage files
echo "📝 Staging all codebase files and documentation..."
git add .

# Commit
echo "💾 Creating production release commit..."
git commit -m "feat(osiris): publish tactical radar simulation, DAG orchestrator, and documentation" || echo "No new changes to commit."

# Check for remote
if git remote | grep -q "origin"; then
  echo "🔗 Remote 'origin' already set to:"
  git remote -v
else
  DEFAULT_REMOTE="https://github.com/Frogman2745/osiris-tactical-radar.git"
  echo "🔗 Setting remote origin to $DEFAULT_REMOTE..."
  git remote add origin "$DEFAULT_REMOTE"
fi

echo ""
echo "✅ Local repository prepared and committed successfully!"
echo ""
echo "To push to your GitHub account now, execute:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "Or if using GitHub CLI (gh):"
echo "   gh repo create Frogman2745/osiris-tactical-radar --public --source=. --remote=origin --push"
echo "=========================================================="
