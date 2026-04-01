#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== 컨테이너 상태 ==="
docker compose ps
echo ""

echo "=== 리소스 사용량 ==="
docker stats ark-server --no-stream 2>/dev/null || echo "컨테이너가 실행 중이 아닙니다."
echo ""

echo "=== 서버 상태 (arkmanager) ==="
docker compose exec ark-server arkmanager status 2>/dev/null || echo "arkmanager에 접근할 수 없습니다."
echo ""

echo "=== 접속 중인 플레이어 ==="
./scripts/rcon.sh listplayers 2>/dev/null || echo "RCON 사용 불가"
