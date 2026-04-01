#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "재시작 경고 전송 중..."
./scripts/rcon.sh "broadcast Server restarting in 60 seconds..." 2>/dev/null || true
sleep 60

echo "백업 생성 중..."
./scripts/backup.sh

echo "서버 재시작 중..."
docker compose restart -t 120
echo "재시작 완료. 로그 추적 중:"
docker compose logs -f --tail=20
