#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_FILE="$ROOT_DIR/.release-state.env"

if [[ $# -lt 1 ]]; then
  echo "Usage: bash scripts/release/activate.sh <image[:tag]>"
  exit 1
fi

NEW_IMAGE="$1"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed."
  exit 1
fi

if docker image inspect "$NEW_IMAGE" >/dev/null 2>&1; then
  echo "Using local image: $NEW_IMAGE"
else
  echo "Pulling image: $NEW_IMAGE"
  docker pull "$NEW_IMAGE"
fi

CURRENT_IMAGE="$(docker inspect -f '{{.Config.Image}}' portfolio_backend 2>/dev/null || true)"

if [[ -z "$CURRENT_IMAGE" ]]; then
  CURRENT_IMAGE="${BACKEND_IMAGE:-portfolio-backend:local}"
fi

echo "Current image: $CURRENT_IMAGE"
echo "Activating image: $NEW_IMAGE"

BACKEND_IMAGE="$NEW_IMAGE" docker compose -f "$COMPOSE_FILE" up -d --no-deps backend

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
  echo "New image failed health check. Rolling back to $CURRENT_IMAGE"
  BACKEND_IMAGE="$CURRENT_IMAGE" docker compose -f "$COMPOSE_FILE" up -d --no-deps backend
  exit 1
fi

cat >"$STATE_FILE" <<EOF
CURRENT_BACKEND_IMAGE=$NEW_IMAGE
PREVIOUS_BACKEND_IMAGE=$CURRENT_IMAGE
UPDATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

echo "Release activated successfully."
echo "CURRENT_BACKEND_IMAGE=$NEW_IMAGE"
