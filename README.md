# ARK: Survival Evolved Dedicated Server

Docker Compose 기반 ARK: Survival Evolved 전용 서버 + 웹 관리 대시보드

## 요구사항

- Docker + Docker Compose
- 최소 RAM 8GB 여유
- 디스크 ~25GB 여유

## 빠른 시작

```bash
# 1. 비밀번호 설정 (.env 파일 편집)
vi .env

# 2. 서버 시작 (첫 실행 시 ~23GB 다운로드, 30-60분 소요)
./scripts/start.sh

# 3. 로그에서 "server is up" 메시지 확인
docker compose logs -f --tail=5
```

## 웹 대시보드

브라우저에서 서버를 관리할 수 있는 웹 UI를 제공합니다.

### 기능

- 서버 시작/중지/재시작/업데이트
- 실시간 서버 상태 모니터링 (CPU, RAM, 업타임)
- 접속 중인 플레이어 목록
- RCON 콘솔 (웹에서 직접 명령 실행)
- 서버 설정 GUI 편집 (.env, GameUserSettings.ini, Game.ini)
- 모드 관리 (Steam Workshop ID 추가/제거)
- 백업 생성/복원/삭제/자동 스케줄
- 실시간 로그 뷰어
- CPU/RAM/접속자 수 메트릭 그래프
- 알림 규칙 설정 (임계값 초과 시 경고)

### 대시보드 시작

```bash
# 방법 1: Docker로 실행 (권장)
docker compose up -d ark-dashboard
# 브라우저에서 http://서버IP:3000 접속

# 방법 2: 로컬 개발 모드
cd dashboard
npm install
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

### 대시보드 비밀번호 설정

기본적으로 `.env`의 `ADMIN_PASSWORD` 값으로 로그인합니다.

별도의 대시보드 비밀번호를 설정하려면:

```bash
# bcrypt 해시 생성
node -e "console.log(require('bcryptjs').hashSync('원하는비밀번호', 10))"

# .env에 추가
DASHBOARD_PASSWORD_HASH=생성된해시값
```

## 클라이언트 접속

### Steam 서버 브라우저
1. Steam → **보기(View)** → **게임 서버(Game Servers)**
2. **즐겨찾기(Favorites)** 탭 → 하단 **+** 버튼
3. `서버IP:27015` 입력 → 추가
4. 목록에서 선택 → **연결(Connect)** → 비밀번호 입력

### ARK 게임 내
1. ARK 실행 → **서버 접속(Join ARK)**
2. **비공식(Unofficial)** 선택 → `HidiARK` 검색
3. 또는 **직접 접속(Direct Connect)** → `서버IP:7777` 입력

> 27015는 서버 조회용(쿼리 포트), 7777은 실제 접속용(게임 포트)입니다.

## 관리 스크립트

CLI로도 서버를 관리할 수 있습니다.

| 명령 | 설명 |
|------|------|
| `./scripts/start.sh` | 서버 시작 |
| `./scripts/stop.sh` | 월드 저장 후 안전 종료 (30초 경고) |
| `./scripts/restart.sh` | 60초 경고 → 백업 → 재시작 |
| `./scripts/update.sh` | 백업 후 서버 업데이트 |
| `./scripts/status.sh` | 상태, 리소스 사용량, 접속자 확인 |
| `./scripts/backup.sh` | 수동 백업 생성 |
| `./scripts/restore.sh` | 백업 복원 (인수 없이 실행하면 목록 표시) |

## RCON (원격 관리)

```bash
# 인터랙티브 모드
./scripts/rcon.sh

# 단일 명령
./scripts/rcon.sh listplayers
./scripts/rcon.sh saveworld
./scripts/rcon.sh "broadcast 서버 점검 예정"
```

### 자주 쓰는 RCON 명령어

| 명령 | 설명 |
|------|------|
| `listplayers` | 접속자 목록 |
| `saveworld` | 월드 저장 |
| `broadcast <메시지>` | 전체 공지 |
| `settimeofday 12:00` | 시간 변경 |
| `destroywilddinos` | 야생 공룡 리스폰 |
| `doexit` | 서버 종료 |

## 모드 추가

1. [Steam Workshop](https://steamcommunity.com/app/346110/workshop/)에서 모드 ID 확인
2. `.env` 파일 수정 또는 대시보드 모드 관리 페이지에서 추가:
   ```
   ARK_MODS=731604991,889745138
   ```
3. `./scripts/restart.sh` 로 재시작

## 서버 설정 변경

대시보드의 **설정** 페이지에서 GUI로 변경하거나, 파일을 직접 편집합니다:

- **서버 기본 설정:** `.env` (이름, 맵, 비밀번호, 모드)
- **게임플레이 설정:** `ark-config/GameUserSettings.ini` (배율, 낮/밤, 엔그램 등)
- **고급 설정:** `ark-config/Game.ini` (스탯 오버라이드 등)

설정 변경 후 `./scripts/restart.sh` 로 재시작 필요

## 맵 변경

`.env` 파일에서 `SERVER_MAP` 변경:

```
SERVER_MAP=TheIsland        # 기본
SERVER_MAP=Ragnarok         # 라그나로크
SERVER_MAP=TheCenter        # 더 센터
SERVER_MAP=Valguero_P       # 발게로
SERVER_MAP=CrystalIsles     # 크리스탈 아일즈
SERVER_MAP=LostIsland       # 로스트 아일랜드
SERVER_MAP=Fjordur          # 피요르두르
```

## 백업

대시보드의 **백업** 페이지에서 관리하거나 CLI를 사용합니다.

- 백업 위치: `backups/`
- 파일명 형식: `ark-backup-YYYYMMDD_HHMMSS.tar.gz`
- 기본 보관: 7일 / 최대 20개

```bash
# 수동 백업
./scripts/backup.sh

# 복원 가능한 백업 목록
./scripts/restore.sh

# 특정 백업 복원
./scripts/restore.sh ark-backup-20260329_120000.tar.gz
```

## 포트 정보

| 포트 | 프로토콜 | 용도 |
|------|----------|------|
| 3000 | TCP | 웹 대시보드 |
| 7777 | UDP | 게임 접속 |
| 7778 | UDP | 게임 내부 (자동 사용) |
| 27015 | UDP | Steam 서버 조회 |
| 27020 | TCP | RCON 관리 (로컬 전용) |

## 프로젝트 구조

```
arkSurv/
├── dashboard/           # 웹 대시보드 (Next.js)
│   ├── src/
│   │   ├── app/         # 페이지 및 API 라우트
│   │   ├── components/  # UI 컴포넌트
│   │   ├── hooks/       # React 훅
│   │   ├── lib/         # 백엔드 로직 (Docker, RCON, DB 등)
│   │   └── types/       # TypeScript 타입 정의
│   ├── Dockerfile
│   └── package.json
├── scripts/             # CLI 관리 스크립트
├── ark-config/          # GameUserSettings.ini, Game.ini
├── ark-data/            # 서버 데이터 (자동 생성)
├── backups/             # 백업 파일
├── docker-compose.yml
├── .env                 # 서버 설정
└── .env.example         # 설정 템플릿
```
