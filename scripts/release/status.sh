#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_FILE="$ROOT_DIR/.release-state.env"

RUNNING_IMAGE="$(docker inspect -f '{{.Config.Image}}' portfolio_backend 2>/dev/null || echo "not-running")"
echo "Running backend image: $RUNNING_IMAGE"

if [[ -f "$STATE_FILE" ]]; then
  echo
  echo "Release state file (.release-state.env):"
  cat "$STATE_FILE"
else
  echo
  echo "No .release-state.env found yet."
fi
