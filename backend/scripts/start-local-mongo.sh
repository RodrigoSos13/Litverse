#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${MONGODB_DB_PATH:-$ROOT_DIR/.mongodb-data}"
PORT="${MONGODB_PORT:-27017}"
HOST="${MONGODB_HOST:-127.0.0.1}"

mkdir -p "$DB_PATH"

exec mongod --dbpath "$DB_PATH" --bind_ip "$HOST" --port "$PORT" --nounixsocket
