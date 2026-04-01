#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "ARK 서버 시작 중... (첫 실행 시 ~15GB 다운로드, 30-60분 소요)"
docker compose up -d
echo ""
echo "로그 추적 중 (Ctrl+C로 분리, 서버는 계속 실행):"
docker compose logs -f --tail=50
