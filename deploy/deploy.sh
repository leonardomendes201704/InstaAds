#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="/opt/instaads"
ENV_FILE="$TARGET_DIR/deploy/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Arquivo $ENV_FILE não encontrado. Abortando deploy."
  exit 1
fi

echo "Sincronizando código para $TARGET_DIR ..."
rsync -a --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'deploy/.env' \
  --exclude '.env.local' \
  --exclude '.env.migrate' \
  --exclude '.vercel' \
  "$SOURCE_DIR/" "$TARGET_DIR/"

echo "Reconstruindo e reiniciando app ..."
cd "$TARGET_DIR/deploy"
docker compose up -d --build app

echo "Deploy concluído."
