# 이음 FE

돌봄 요청자와 검증된 메이트를 연결하는 매칭 플랫폼 **이음**의 프론트엔드입니다.  
React 기반 업무 화면과 Svelte 기반 메인 랜딩을 Vite에서 함께 구동하며, 백엔드의 `/api/v1` REST API와 JWT 인증 흐름에 맞춰 연동되어 있습니다.

## 한눈에 보기

- 일반 사용자: 프로젝트 등록, 메이트 탐색, 제안 전송, 리뷰/신고 관리
- 메이트: 받은 제안 확인, 프로젝트 진행 상태 관리, 포트폴리오/인증 요청 관리
- 관리자: 사용자, 메이트, 프로젝트, 인증 심사, 리뷰/신고, 운영 리포트 관리
- 인증: 이메일 로그인, 카카오 로그인, access token/refresh token 기반 세션 유지
- 알림: 공지, 제안, 프로젝트 상태, 인증 결과 알림 확인 및 읽음 처리

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Runtime | Node.js, Vite |
| UI | React 19, Svelte 5 |
| Language | TypeScript |
| Styling | CSS Modules-by-folder 구조의 plain CSS |
| Quality | ESLint, TypeScript build |
| Build | Vite manual chunks, React Compiler preset |

## 주요 기능

### 사용자

- 프로젝트 생성, 수정, 취소, 상세 조회
- 메이트 목록/상세 조회
- 요청 상태 프로젝트를 선택해 메이트에게 제안 전송
- 내 리뷰 수정/삭제, 신고 내역 확인
- 마이페이지 계정 정보 수정

### 메이트

- 받은 제안 목록 조회
- 제안 수락/거절
- 수락된 프로젝트 시작/완료 처리
- 포트폴리오 파일 업로드/삭제
- 인증 요청 생성, 상세 조회, 인증 파일 업로드/삭제

### 관리자

- 대시보드 지표 확인
- 메이트 공개 여부/활성 상태 변경
- 프로젝트 상세 조회 및 취소
- 인증 요청 승인/반려
- 리뷰 블라인드/해제
- 신고 승인/반려 처리
- 운영 리포트 확인

## 화면 라우팅

| Path | 설명 |
| --- | --- |
| `/` | Svelte 메인 페이지 |
| `/login` | 로그인 |
| `/login/kakao/callback` | 카카오 OAuth 콜백 |
| `/register` | 회원가입 |
| `/announcement` | 공지사항 |
| `/freelancers` | 메이트 목록 |
| `/freelancers/:id` | 메이트 상세 |
| `/project` | 프로젝트/제안 관리 |
| `/mypage` | 마이페이지 및 관리자 콘솔 |
| `/ai-match` | AI 매칭 |
| `/error` | 권한/오류 페이지 |

## 프로젝트 구조

```text
src
├─ api/                 # 백엔드 REST API 클라이언트
├─ auth/                # 토큰 저장, 세션 부트스트랩, 카카오 OAuth
├─ components/          # 공통 헤더, 채팅 위젯
├─ mainpage/            # Svelte 메인 페이지
├─ loginpage/           # 로그인 및 카카오 콜백
├─ registerpage/        # 회원가입
├─ announcementpage/    # 공지사항
├─ freelancerpage/      # 메이트 목록/상세/제안
├─ projectpage/         # 프로젝트, 제안, 리뷰
├─ mypage/              # 사용자 마이페이지 및 관리자 콘솔
├─ aimatchpage/         # AI 매칭 화면
├─ errorpage/           # 오류 페이지
├─ lib/                 # 에러/참조 데이터 유틸
└─ store/               # 인증, 권한, 테마, 레거시 스토어 어댑터
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 참고해 `.env`를 생성합니다.

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_KAKAO_JAVASCRIPT_KEY=your-kakao-javascript-key
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/login/kakao/callback
VITE_KAKAO_SCOPE=account_email,profile_nickname
VITE_KAKAO_SDK_URL=https://t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js
```

백엔드는 기본적으로 `http://localhost:8080`에서 실행되는 것을 전제로 합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

Vite 기본 주소는 다음과 같습니다.

```text
http://localhost:5173
```

### 4. 빌드

```bash
npm run build
```

### 5. 빌드 결과 미리보기

```bash
npm run preview
```

## API 연동 방식

- API base URL은 `VITE_API_BASE_URL`로 제어합니다.
- 공통 요청 처리는 `src/api/client.ts`에서 담당합니다.
- 인증 토큰과 세션 복구는 `src/auth/*`, `src/store/appAuth.ts`에서 관리합니다.
- 백엔드 인증은 JWT Bearer 토큰 기반이며, 401 응답 시 refresh token 재발급 흐름을 사용합니다.
- 주요 API 모듈은 도메인별로 분리되어 있습니다.

```text
auth.ts            로그인/회원가입
users.ts           마이페이지 사용자 정보
projects.ts        프로젝트 CRUD 및 상태 변경
proposals.ts       제안 조회/수락/거절
freelancers.ts     메이트 프로필/파일
verifications.ts   인증 요청/파일
reviews.ts         리뷰
reports.ts         신고
notifications.ts   알림
notices.ts         공지
admin.ts           관리자 API
codes.ts           공통 코드
recommendations.ts AI 추천
```

## 권한 모델

프론트 권한 판단은 `src/store/accessControl.ts`에 모여 있습니다.

| Role | 주요 접근 |
| --- | --- |
| `ROLE_USER` | 프로젝트 등록, 메이트 제안, 마이페이지 |
| `ROLE_FREELANCER` | 받은 제안, 프로젝트 진행, 인증/포트폴리오 |
| `ROLE_ADMIN` | 관리자 콘솔, 공지 관리, 운영 데이터 관리 |

관리자 로그인 시 일반 사용자용 프로젝트 메뉴는 헤더에서 숨기고, 프로젝트 관리는 `마이페이지 > 프로젝트` 탭에서 처리합니다.

## 개발 메모

- React와 Svelte를 한 앱에서 함께 사용합니다. 라우팅 진입은 `src/main.tsx`에서 처리합니다.
- 메인 페이지는 Svelte, 대부분의 업무 화면은 React로 구성되어 있습니다.
- CSS는 각 페이지 폴더에 함께 배치되어 화면 단위로 관리합니다.
- `.env`에는 실제 API 주소나 카카오 키가 들어갈 수 있으므로 커밋하지 않습니다.

## 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | TypeScript 빌드 후 Vite 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run preview` | 빌드 결과 미리보기 |

## 팀

**AIBE5 Project 2 Team 4**  
돌봄 서비스 요청부터 메이트 매칭, 인증, 운영 관리까지 이어지는 하나의 흐름을 만드는 프론트엔드 저장소입니다.
