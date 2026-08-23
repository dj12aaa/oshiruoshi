#!/usr/bin/env bash
set -euo pipefail

message=${1:?verification commit message is required}
if git diff --cached --quiet; then
  exit 0
fi

git commit -m "$message"
for attempt in 1 2 3 4; do
  if git push origin HEAD:main; then
    exit 0
  fi
  git fetch origin main
  git rebase origin/main
done

echo 'verification result could not be pushed after four attempts' >&2
exit 1
