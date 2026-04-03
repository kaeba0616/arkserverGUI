# Game Server Manager

Docker 기반 멀티 게임 서버 관리 웹 대시보드

ARK: Survival Evolved, Minecraft 등 여러 게임 서버를 하나의 웹 UI에서 관리할 수 있습니다.
게임 어댑터 플러그인 구조로 새 게임 추가가 쉽습니다.

## 지원 게임

| 게임 | Docker 이미지 | 포트 |
|------|---------------|------|
| ARK: Survival Evolved | `hermsi/ark-server:latest` | 7777(UDP), 27015(UDP), 27020(TCP) |
| Minecraft | `itzg/minecraft-server:latest` | 25565(TCP), 25575(TCP) |

새 게임 추가: `dashboard/src/lib/adapters/`에 어댑터 파일 작성

## 요구사항

- Docker + Docker Compose
- 최소 RAM 8GB 여유
- 디스크 ~25GB 여유

## 빠른 시작

```bash
# 1. 비밀번호 설정
cp .env.example .env
vi .env

# 2. 대시보드 시작
docker compose up -d

# 3. 브라우저에서 접속
# http://서버IP:3000
```

대시보드에서 서버 관리 → 새 서버 추가로 게임 서버를 생성/시작할 수 있습니다.

## 웹 대시보드

브라우저에서 서버를 관리할 수 있는 웹 UI를 제공합니다.

### 기능

- **멀티 서버 관리** - 여러 게임 서버를 하나의 대시보드에서 전환하며 관리
- 서버 시작/중지/재시작/업데이트
- 실시간 서버 상태 모니터링 (CPU, RAM, 업타임)
- 접속 중인 플레이어 목록
- RCON 콘솔 (웹에서 직접 명령 실행)
- 서버 설정 GUI 편집 (게임별 설정 파일 자동 감지)
- 모드 관리 (ARK: Steam Workshop ID)
- 백업 생성/복원/삭제/자동 스케줄
- 실시간 로그 뷰어
- CPU/RAM/접속자 수 메트릭 그래프
- 알림 규칙 설정 (임계값 초과 시 경고)

### 대시보드 비밀번호

기본적으로 `.env`의 `ADMIN_PASSWORD` 값으로 로그인합니다.

별도 비밀번호를 설정하려면:

```bash
# bcrypt 해시 생성
node -e "console.log(require('bcryptjs').hashSync('원하는비밀번호', 10))"

# .env에 추가
DASHBOARD_PASSWORD_HASH=생성된해시값
```

## 서버 추가 방법

1. 대시보드 접속 → 사이드바 하단 **서버 관리** 클릭
2. **새 서버 추가** 버튼 클릭
3. 게임 선택 (ARK / Minecraft)
4. 서버 이름, ID, 비밀번호, 게임별 설정 입력
5. **서버 생성** → Docker 컨테이너가 자동으로 생성됨
6. 서버 목록에서 **시작** 버튼 클릭

## 게임별 접속 방법

### ARK: Survival Evolved
- Steam 서버 브라우저에서 `서버IP:27015` 추가
- 또는 게임 내 직접 접속 `서버IP:7777`

### Minecraft
- Minecraft 클라이언트 → 멀티플레이 → 서버 추가 → `서버IP:25565`

## CLI 관리 스크립트

대시보드 없이 CLI로도 ARK 서버를 관리할 수 있습니다.

| 명령 | 설명 |
|------|------|
| `./scripts/start.sh` | 서버 시작 |
| `./scripts/stop.sh` | 월드 저장 후 안전 종료 |
| `./scripts/restart.sh` | 경고 → 백업 → 재시작 |
| `./scripts/update.sh` | 백업 후 서버 업데이트 |
| `./scripts/status.sh` | 상태 확인 |
| `./scripts/backup.sh` | 수동 백업 |
| `./scripts/restore.sh` | 백업 복원 |

## RCON

```bash
# 인터랙티브 모드
./scripts/rcon.sh

# 단일 명령
./scripts/rcon.sh listplayers
./scripts/rcon.sh "broadcast 서버 점검 예정"
```

## 포트 정보

| 포트 | 프로토콜 | 용도 |
|------|----------|------|
| 3000 | TCP | 웹 대시보드 |
| 7777 | UDP | ARK 게임 접속 |
| 27015 | UDP | ARK Steam 서버 조회 |
| 27020 | TCP | ARK RCON |
| 25565 | TCP | Minecraft 게임 접속 |
| 25575 | TCP | Minecraft RCON |

## 프로젝트 구조

```
├── dashboard/              # 웹 대시보드 (Next.js)
│   ├── src/
│   │   ├── app/            # 페이지 및 API 라우트
│   │   ├── components/     # UI 컴포넌트
│   │   ├── hooks/          # React 훅
│   │   ├── lib/
│   │   │   ├── adapters/   # 게임 어댑터 (ark, minecraft)
│   │   │   ├── config/     # 설정 파서 (env, ini, properties)
│   │   │   └── ...         # Docker, RCON, DB 등
│   │   └── types/          # TypeScript 타입
│   ├── Dockerfile
│   └── package.json
├── scripts/                # CLI 관리 스크립트
├── ark-config/             # ARK 설정 파일
├── data/                   # DB + 서버 데이터 (자동 생성)
├── docker-compose.yml
├── .env                    # 설정 (gitignore 대상)
└── .env.example            # 설정 템플릿
```

## 새 게임 어댑터 추가

`dashboard/src/lib/adapters/`에 새 파일을 만들고 `GameAdapter` 인터페이스를 구현하면 됩니다:

```typescript
// dashboard/src/lib/adapters/valheim.ts
import type { GameAdapter } from "./types";

export const valheimAdapter: GameAdapter = {
  id: "valheim",
  displayName: "Valheim",
  // ... Docker 이미지, 포트, RCON 명령, 설정 필드 등 정의
};
```

그리고 `dashboard/src/lib/adapters/index.ts`에 등록:

```typescript
import { valheimAdapter } from "./valheim";
const adapters = { ..., valheim: valheimAdapter };
```
