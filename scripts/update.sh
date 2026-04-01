#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "업데이트 전 백업 생성 중..."
./scripts/backup.sh

echo "ARK 서버 업데이트 중..."
docker compose exec ark-server arkmanager update --force
echo "업데이트 완료. ./scripts/restart.sh 로 재시작하세요."
