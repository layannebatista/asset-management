#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
OPENAPI_FILE="$ROOT_DIR/openapi/openapi.yaml"
POSTMAN_FILE="$ROOT_DIR/postman/collection.json"
APP_LOG="$(mktemp)"

cleanup() {
  if [[ -n "${APP_PID:-}" ]] && kill -0 "$APP_PID" 2>/dev/null; then
    kill "$APP_PID" || true
    wait "$APP_PID" 2>/dev/null || true
  fi
  rm -f "$APP_LOG"
}
trap cleanup EXIT

echo "[sync-api-contract] iniciando backend para exportar OpenAPI"
(
  cd "$BACKEND_DIR"
  mvn -DskipTests spring-boot:run >"$APP_LOG" 2>&1
) &
APP_PID=$!

for i in {1..180}; do
  if curl -fsS "http://localhost:8080/v3/api-docs.yaml" -o "$OPENAPI_FILE"; then
    echo "[sync-api-contract] OpenAPI atualizado em $OPENAPI_FILE"
    break
  fi
  if ! kill -0 "$APP_PID" 2>/dev/null; then
    echo "[sync-api-contract] backend encerrou antes de responder /v3/api-docs.yaml" >&2
    echo "[sync-api-contract] ultimas linhas do backend:" >&2
    tail -n 120 "$APP_LOG" >&2 || true
    exit 1
  fi
  sleep 2
  if [[ "$i" == "180" ]]; then
    echo "[sync-api-contract] timeout aguardando /v3/api-docs.yaml" >&2
    echo "[sync-api-contract] ultimas linhas do backend:" >&2
    tail -n 120 "$APP_LOG" >&2 || true
    exit 1
  fi
done

echo "[sync-api-contract] gerando Postman a partir do OpenAPI"
npx --yes openapi-to-postmanv2 \
  -s "$OPENAPI_FILE" \
  -o "$POSTMAN_FILE" \
  -p

echo "[sync-api-contract] contrato sincronizado com sucesso"
