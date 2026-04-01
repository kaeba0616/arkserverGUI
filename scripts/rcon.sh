#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
source "$PROJECT_DIR/.env" 2>/dev/null || true

RCON_BIN="$SCRIPT_DIR/rcon-cli"
HOST="${RCON_HOST:-127.0.0.1}"
PORT="${RCON_PORT:-27020}"
PASS="${RCON_PASSWORD:-${ADMIN_PASSWORD:-}}"

if [ ! -f "$RCON_BIN" ]; then
    echo "ERROR: rcon-cli not found. Run the following to install:"
    echo "  curl -sL https://github.com/gorcon/rcon-cli/releases/download/v0.10.3/rcon-0.10.3-amd64_linux.tar.gz | tar xz -C /tmp"
    echo "  cp /tmp/rcon-0.10.3-amd64_linux/rcon $SCRIPT_DIR/rcon-cli"
    exit 1
fi

if [ $# -eq 0 ]; then
    "$RCON_BIN" -a "${HOST}:${PORT}" -p "$PASS"
else
    "$RCON_BIN" -a "${HOST}:${PORT}" -p "$PASS" -c "$*"
fi
