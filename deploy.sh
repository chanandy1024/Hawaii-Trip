#!/usr/bin/env bash
# Push the current state of this folder to GitHub Pages.
set -e
cd "$(dirname "$0")"
MSG="${1:-Update trip plan}"
git add -A
git commit -m "$MSG" || echo "Nothing to commit."
git push
echo
echo "Pushed. Pages usually redeploys within a minute:"
echo "  https://chanandy1024.github.io/Hawaii-Trip/"
