#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
source "$PROJECT_DIR/.env" 2>/dev/null || true

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
MAX_BACKUPS="${BACKUP_COUNT_MAX:-20}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
SAVE_DIR="$PROJECT_DIR/ark-data/server/ShooterGame/Saved"

mkdir -p "$BACKUP_DIR"

# RCON으로 월드 저장 요청
"$SCRIPT_DIR/rcon.sh" saveworld 2>/dev/null || echo "WARN: RCON saveworld 실패, 마지막 저장 상태를 백업합니다"
sleep 5

# SavedArks와 Config를 tarball로 생성
tar -czf "$BACKUP_DIR/ark-backup-${TIMESTAMP}.tar.gz" \
    -C "$SAVE_DIR" \
    SavedArks/ Config/ 2>/dev/null || {
    echo "ERROR: 백업 실패. 세이브 디렉토리 확인: $SAVE_DIR"
    exit 1
}

# 오래된 백업 삭제 (보관일수 기준)
find "$BACKUP_DIR" -name "ark-backup-*.tar.gz" -mtime "+$RETENTION_DAYS" -delete

# 백업 개수 제한
COUNT=0
ls -t "$BACKUP_DIR"/ark-backup-*.tar.gz 2>/dev/null | while IFS= read -r file; do
    COUNT=$((COUNT + 1))
    if [ "$COUNT" -gt "$MAX_BACKUPS" ]; then
        rm -f "$file"
    fi
done

echo "백업 완료: ark-backup-${TIMESTAMP}.tar.gz"
echo "백업 수: $(ls "$BACKUP_DIR"/ark-backup-*.tar.gz 2>/dev/null | wc -l)"
