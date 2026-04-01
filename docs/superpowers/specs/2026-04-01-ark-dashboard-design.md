# ARK Server Manager Web Dashboard - Design Spec

## Context

현재 arkSurv 프로젝트는 Docker Compose + 셸 스크립트(8개)로 ARK: Survival Evolved 전용 서버를 관리한다. CLI 전용이라 서버 상태 확인, 설정 변경, 백업 관리 등 모든 작업이 SSH + 터미널을 통해서만 가능하다.

**목표**: ASM(Ark Server Manager)과 유사한 웹 기반 관리 대시보드를 구축하여 브라우저에서 서버를 완전히 관리할 수 있게 한다.

**기존 셸 스크립트는 CLI 사용 용도로 유지**하되, 대시보드는 Docker API와 RCON을 직접 호출하여 독립적으로 동작한다.

---

## Architecture

### 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router, TypeScript) |
| UI | Tailwind CSS + shadcn/ui |
| Docker 연동 | `dockerode` |
| RCON | `rcon-client` |
| DB | SQLite (`better-sqlite3`) |
| 차트 | Recharts |
| 인증 | bcrypt + JWT (`jose`) |
| 유효성 검증 | Zod |
| 데이터 페칭 | SWR |
| 실시간 로그 | Server-Sent Events (SSE) |

### 배포 구조

`dashboard/` 디렉토리에 Next.js 앱을 구성하고, `docker-compose.yml`에 `ark-dashboard` 서비스를 추가한다.

```yaml
ark-dashboard:
  build: ./dashboard
  container_name: ark-dashboard
  restart: unless-stopped
  ports:
    - "3000:3000"
  extra_hosts:
    - "host.docker.internal:host-gateway"
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - ./.env:/app/server-config/.env
    - ./ark-config:/app/server-config/ark-config
    - ./backups:/app/server-config/backups
    - ./dashboard/data:/app/data
  environment:
    - DASHBOARD_PASSWORD_HASH=${DASHBOARD_PASSWORD_HASH}
    - ARK_CONTAINER_NAME=ark-server
    - ARK_PROJECT_DIR=/app/server-config
    - RCON_HOST=host.docker.internal
    - RCON_PORT=27020
    - RCON_PASSWORD=${ADMIN_PASSWORD}
  depends_on:
    - ark-server
```

**RCON 연결**: ARK 서버가 `network_mode: host`를 사용하므로, 대시보드 컨테이너에서 `extra_hosts`로 `host.docker.internal`을 설정하여 호스트의 RCON 포트(27020)에 접근한다.

**Docker 소켓**: 읽기 전용(`:ro`)으로 마운트하여 컨테이너 상태 조회 및 제어에 사용. 컨테이너 시작/중지는 `dockerode`를 통해 수행한다.

---

## 디렉토리 구조

```
dashboard/
  package.json
  next.config.js
  Dockerfile
  tsconfig.json
  src/
    app/
      layout.tsx
      (auth)/login/page.tsx
      (dashboard)/
        layout.tsx                  # 사이드바 네비게이션
        page.tsx                    # 서버 개요 (메인)
        players/page.tsx
        console/page.tsx
        settings/page.tsx
        backups/page.tsx
        mods/page.tsx
        logs/page.tsx
        metrics/page.tsx
        alerts/page.tsx
      api/
        auth/login/route.ts
        auth/logout/route.ts
        auth/check/route.ts
        server/control/route.ts     # POST {action}
        server/status/route.ts      # GET
        rcon/route.ts               # POST {command}
        players/route.ts            # GET
        settings/env/route.ts       # GET/PUT
        settings/game-user/route.ts # GET/PUT
        settings/game/route.ts      # GET/PUT
        backups/route.ts            # GET/POST/DELETE
        backups/restore/route.ts    # POST
        backups/schedule/route.ts   # GET/PUT
        logs/stream/route.ts        # GET (SSE)
        metrics/route.ts            # GET
        alerts/route.ts             # GET/PUT
    lib/
      docker.ts                     # dockerode 래퍼
      rcon.ts                       # rcon-client 래퍼
      config/
        env-parser.ts               # .env 읽기/쓰기
        ini-parser.ts               # INI 읽기/쓰기
      auth.ts                       # JWT 인증
      db.ts                         # SQLite 초기화
      metrics-collector.ts          # 주기적 메트릭 수집
      backup-scheduler.ts           # node-cron 백업 스케줄
      alerts.ts                     # 임계값 알림
      validators.ts                 # Zod 스키마
    components/
      ui/                           # shadcn/ui
      server-control-panel.tsx
      status-card.tsx
      player-table.tsx
      rcon-terminal.tsx
      settings-form.tsx
      backup-table.tsx
      mod-manager.tsx
      log-viewer.tsx
      metrics-chart.tsx
      alert-config.tsx
      sidebar.tsx
      auth-guard.tsx
    hooks/
      use-server-status.ts
      use-players.ts
      use-log-stream.ts
      use-metrics.ts
    types/
      server.ts
      config.ts
      backup.ts
      alert.ts
  data/
    dashboard.db                    # SQLite (gitignored)
```

---

## 기능 상세

### 1. 인증

- `.env`에 `DASHBOARD_PASSWORD_HASH` (bcrypt 해시) 저장
- 로그인 시 비밀번호 검증 → JWT 발급 → httpOnly 쿠키 설정
- 모든 API 라우트에 JWT 미들웨어 적용 (login 제외)
- 세션 만료: 24시간

### 2. 서버 제어 (`/`)

- **시작/중지/재시작/업데이트** 버튼
- `dockerode`로 컨테이너 start/stop/restart 실행
- 중지 시: RCON으로 `saveworld` → `broadcast` → 30초 대기 → stop
- 업데이트: `container.exec(['arkmanager', 'update', '--force'])`
- 상태 표시: 실행 중/중지/재시작 중 등 (5초 폴링)
- CPU/RAM 실시간 표시 (`container.stats()`)
- 서버 업타임 표시

### 3. 플레이어 목록 (`/players`)

- RCON `listplayers` 명령 결과 파싱
- 테이블: 번호, 플레이어명, Steam ID
- 5초 폴링으로 갱신
- 현재 접속자 수 배지

### 4. RCON 콘솔 (`/console`)

- 터미널 스타일 UI (어두운 배경, 모노스페이스 폰트)
- 명령 입력 → POST → 응답 표시
- 명령 히스토리 (로컬 스토리지)
- 자주 쓰는 명령 빠른 버튼 (saveworld, listplayers, destroywilddinos 등)

### 5. 서버 설정 (`/settings`)

탭으로 구분된 3개 설정 영역:

**환경 변수 탭 (.env)**:
- SESSION_NAME, SERVER_MAP (드롭다운), SERVER_PASSWORD, MAX_PLAYERS
- ARK_MODS (모드 페이지로 연결)
- 저장 시 .env 파일 덮어쓰기 → 재시작 안내

**GameUserSettings.ini 탭**:
- 카테고리별 폼: 배율 설정 (테이밍, XP, 수확 등), 브리딩 설정, 낮/밤 주기
- 숫자 입력 + 슬라이더
- 저장 시 INI 파일 업데이트 → 재시작 안내

**Game.ini 탭**:
- 트라이브 설정, 리스폰 설정 등
- 저장 시 INI 파일 업데이트 → 재시작 안내

### 6. 모드 관리 (`/mods`)

- 현재 설치된 모드 ID 목록 표시 (`.env`의 `ARK_MODS` 파싱)
- 모드 ID 추가/제거
- Steam Workshop 링크 제공
- 변경 시 .env 업데이트 → 재시작 안내

### 7. 백업 관리 (`/backups`)

- `backups/` 디렉토리의 tar.gz 목록 (파일명, 크기, 날짜)
- **생성**: RCON saveworld → tar.gz 생성 → 보존 정책 적용
- **복원**: 확인 다이얼로그 → 서버 중지 → pre-restore 백업 → 복원 → 시작 안내
- **삭제**: 특정 백업 삭제
- **스케줄**: cron 표현식으로 자동 백업 설정 (node-cron)
- 보존 정책 설정 (일수, 최대 개수)

### 8. 로그 뷰어 (`/logs`)

- SSE로 `docker compose logs -f` 스트리밍
- 자동 스크롤 (토글 가능)
- 최근 N줄 표시 (기본 500)
- 텍스트 필터/검색
- 로그 레벨 색상 구분

### 9. 메트릭 (`/metrics`)

- **수집**: `metrics-collector.ts`가 30초마다 `container.stats()`로 CPU/RAM 수집 → SQLite 저장
- **표시**: Recharts 라인 차트
  - CPU 사용률 (%)
  - 메모리 사용량 (MB)
  - 접속자 수 (RCON listplayers)
- **시간 범위**: 1시간, 6시간, 24시간, 7일
- 오래된 데이터 자동 정리 (30일)

### 10. 알림 (`/alerts`)

- 임계값 기반 규칙: CPU > X%, RAM > X MB, 접속자 < N
- 알림 방법: 대시보드 내 알림 배너 (1차 범위)
- 규칙 CRUD → SQLite 저장
- `metrics-collector`가 수집 시 임계값 체크 → 초과 시 알림 이벤트 생성

---

## 실시간 데이터 전략

| 데이터 | 방식 | 주기 |
|--------|------|------|
| 서버 상태, CPU/RAM | SWR 폴링 | 5초 |
| 접속자 목록 | SWR 폴링 | 5초 |
| 로그 | SSE (Server-Sent Events) | 실시간 |
| 메트릭 차트 | SWR 폴링 | 30초 |
| RCON 명령 | REST POST | 요청 시 |

---

## 데이터베이스 (SQLite)

```sql
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  cpu_percent REAL,
  mem_usage_mb REAL,
  mem_limit_mb REAL,
  player_count INTEGER
);

CREATE TABLE backup_schedule (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled INTEGER DEFAULT 0,
  cron_expression TEXT DEFAULT '0 */6 * * *',
  retention_days INTEGER DEFAULT 7,
  max_count INTEGER DEFAULT 20
);

CREATE TABLE alert_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric TEXT NOT NULL,        -- 'cpu', 'memory', 'players'
  operator TEXT NOT NULL,      -- 'gt', 'lt', 'eq'
  threshold REAL NOT NULL,
  enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE alert_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER REFERENCES alert_rules(id),
  timestamp INTEGER NOT NULL,
  value REAL NOT NULL,
  acknowledged INTEGER DEFAULT 0
);
```

---

## 주요 라이브러리 의존성

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "dockerode": "^4",
    "rcon-client": "^4",
    "better-sqlite3": "^11",
    "jose": "^5",
    "bcryptjs": "^2",
    "zod": "^3",
    "swr": "^2",
    "recharts": "^2",
    "node-cron": "^3",
    "ini": "^4",
    "dotenv": "^16"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^3",
    "@types/dockerode": "^3",
    "@types/better-sqlite3": "^7",
    "@types/node-cron": "^3"
  }
}
```

---

## 검증 방법

1. `cd dashboard && npm run dev`로 로컬 개발 서버 실행
2. 브라우저에서 `localhost:3000` 접속 → 로그인 화면 확인
3. 각 페이지 기능 테스트:
   - 서버 상태 조회 (ARK 컨테이너 실행 중일 때)
   - RCON 명령 실행 (`listplayers`)
   - 설정 읽기/쓰기 (INI, .env)
   - 백업 목록 조회
   - 로그 스트리밍
4. Docker 배포: `docker compose up -d` → ark-dashboard 컨테이너 정상 동작 확인
5. 메트릭 수집 → 30초 후 차트 데이터 확인

---

## 범위 외 (향후 추가 가능)

- Discord/Telegram 웹훅 알림
- 다중 서버 관리
- 플레이어 밴/킥 관리
- 맵별 세이브 데이터 관리
- 모바일 반응형 UI 최적화
