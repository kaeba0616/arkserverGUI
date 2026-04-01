#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="./backups"
SAVE_DIR="./ark-data/server/ShooterGame/Saved"

if [ $# -eq 0 ]; then
    echo "사용 가능한 백업 목록:"
    ls -lht "$BACKUP_DIR"/ark-backup-*.tar.gz 2>/dev/null || { echo "백업이 없습니다."; exit 1; }
    echo ""
    echo "사용법: $0 <백업파일명>"
    exit 0
fi

BACKUP_FILE="$BACKUP_DIR/$1"
[ -f "$BACKUP_FILE" ] || { echo "백업 파일을 찾을 수 없습니다: $BACKUP_FILE"; exit 1; }

echo "WARNING: 현재 세이브 데이터를 덮어씁니다!"
echo "복원 대상: $1"
read -rp "계속하시겠습니까? [y/N] " confirm
[ "$confirm" = "y" ] || exit 0

# 서버 정지
docker compose stop -t 120

# 복원 전 현재 상태 백업
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
tar -czf "$BACKUP_DIR/pre-restore-${TIMESTAMP}.tar.gz" -C "$SAVE_DIR" SavedArks/ Config/ 2>/dev/null || true

# 복원
tar -xzf "$BACKUP_FILE" -C "$SAVE_DIR"
echo "복원 완료. ./scripts/start.sh 로 서버를 시작하세요."
