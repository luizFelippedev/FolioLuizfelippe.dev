#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_FILE="$ROOT_DIR/.release-state.env"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

if [[ ! -f "$STATE_FILE" ]]; then
  echo "No release state found at .release-state.env"
  exit 1
fi

# shellcheck disable=SC1090
source "$STATE_FILE"

if [[ -z "${PREVIOUS_BACKEND_IMAGE:-}" ]]; then
  echo "PREVIOUS_BACKEND_IMAGE is missing in .release-state.env"
  exit 1
fi

echo "Rolling back backend to: $PREVIOUS_BACKEND_IMAGE"
docker pull "$PREVIOUS_BACKEND_IMAGE" || true
BACKEND_IMAGE="$PREVIOUS_BACKEND_IMAGE" docker compose -f "$COMPOSE_FILE" up -d --no-deps backend

echo "Waiting backend readiness..."
READY_OK=0
for _ in $(seq 1 30); do
  if curl -fsS http://localhost/ready >/dev/null 2>&1; then
    READY_OK=1
    break
  fi
  sleep 2
done

if [[ "$READY_OK" -ne 1 ]]; then
  echo "Rollback health check failed. Manual intervention required."
  exit 1
fi

cat >"$STATE_FILE" <<EOF
CURRENT_BACKEND_IMAGE=$PREVIOUS_BACKEND_IMAGE
PREVIOUS_BACKEND_IMAGE=${CURRENT_BACKEND_IMAGE:-$PREVIOUS_BACKEND_IMAGE}
UPDATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

echo "Rollback completed successfully."
