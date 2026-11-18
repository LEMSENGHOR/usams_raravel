#!/usr/bin/env bash
# Proves the backend was not touched. Run inside your Laravel project (needs git):
#   bash scripts/verify-backend.sh
# Fails if any protected backend path is modified, staged, deleted or added.
set -euo pipefail
PROTECTED='^(app/Models/|app/Http/Controllers/Api/|app/Http/Requests/|app/Http/Resources/|app/Http/Middleware/|database/|routes/api\.php$|config/auth\.php$|config/sanctum\.php$)'

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository, so changes cannot be checked automatically."
  echo "Commit your project first (git init && git add -A && git commit), then run this again after installing."
  exit 2
fi

# git status --porcelain lists modified, staged, deleted and untracked files (rename targets included)
changed="$(git status --porcelain | sed -E 's/^.{3}//; s/.* -> //' | grep -E "$PROTECTED" || true)"
if [ -n "$changed" ]; then
  echo "BACKEND FILES CHANGED:"; echo "$changed"; exit 1
fi
echo "OK: no protected backend file was modified, added or deleted."
git status --porcelain | sed -E 's/^.{3}//' | sed 's/^/  changed: /'
