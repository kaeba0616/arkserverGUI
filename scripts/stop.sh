#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "월드 저장 중..."
./scripts/rcon.sh saveworld 2>/dev/null || true
sleep 10

echo "종료 경고 전송 중..."
./scripts/rcon.sh "broadcast Server shutting down in 30 seconds..." 2>/dev/null || true
sleep 30

echo "ARK 서버 종료 중..."
docker compose stop -t 120
docker compose down
echo "서버가 종료되었습니다."
