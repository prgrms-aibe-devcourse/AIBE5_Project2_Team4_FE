# 안심동행 FE/BE 실연동 전환 계획

## 기준
- README가 아니라 실제 FE 소스, 실제 Spring controller/DTO, 실제 integration test를 기준으로 정리했다.
- Oracle 스키마가 source of truth 이므로 DDL/ALTER/migration 작업은 하지 않는다.
- 이번 작업의 핵심은 FE의 mock/localStorage 기반 domain data를 제거하고 실제 API 응답을 바로 렌더링하는 것이다.

## FE mock source 목록

### 인증/계정
- `src/store/appAuth.ts`
  - localStorage key: `auth_user`, `known_users`, `registered_accounts`
  - mock source: `DEMO_ACCOUNTS`, `findAccount`, `registerAccount`, `findAccountByEmail`
- `src/loginpage/Login.tsx`
  - `findAccount`, `findAccountByEmail`, `DEMO_ACCOUNTS` 사용
- `src/registerpage/RegisterPage.tsx`
  - `registerAccount` 사용
- `src/main.tsx`
  - `getUser()`를 동기 호출해서 route guard 수행

### 프로젝트/제안/리뷰
- `src/store/appProjectStore.ts`
  - localStorage key: `stella_projects`
  - mock source: `DEFAULT_PROJECTS`
- `src/store/appProposalStore.ts`
  - localStorage key: `proposals`
- `src/store/appReviewStore.ts`
  - localStorage key: `stella_reviews`
  - mock source: seed review, `DEFAULT_REVIEW_TAGS`
- `src/projectpage/ProjectPage3.tsx`
  - 프로젝트/제안/리뷰/알림을 전부 local store로 처리
- `src/projectpage/ProjectFormModal.tsx`
  - FE 전용 flat form shape 사용
- `src/projectpage/ProposalTab.tsx`
  - owner/freelancer 응답 shape 차이 없이 FE 전용 proposal shape 사용
- `src/projectpage/ReviewModal.tsx`
  - 문자열 태그 배열 기준 UI

### 프리랜서
- `src/store/appFreelancerStore.ts`
  - mock source: `FREELANCERS`
- `src/freelancerpage/FreelancerPage.tsx`
  - 목록/검색/필터가 `FREELANCERS`에 고정
- `src/freelancerpage/FreelancerDetailPage2.tsx`
  - `MOCK_USER_PROJECTS`
  - local proposal/report/notification 생성
- `src/aimatchpage/AiMatchPage.tsx`
  - `FREELANCERS`를 직접 사용

### 알림/공지
- `src/store/notificationStore.ts`
  - localStorage key: `stella_notifications`, `stella_announcement_history`
  - mock source: local announcement fan-out, local unread count
- `src/announcementpage/AnnouncementPage.tsx`
  - 공지 생성/발행/이력 전부 local store 기반
- `src/components/AppHeader.tsx`
  - local notification center 사용
- `src/components/AppHeader.svelte`
  - local notification center 사용

### 마이페이지/관리자
- `src/mypage/MyPage2.tsx`
  - 계정/리뷰/검증/프로젝트/제안/관리자 대시보드가 전부 mock 합성
- `src/mypage/tabs/VerifyTab.tsx`
  - `FREELANCERS`와 `INITIAL_VERIFY_REQUESTS` 의존
- `src/mypage/tabs/ReviewsTab.tsx`
  - local review record 의존
- `src/mypage/tabs/ReportsTab.tsx`
  - local reported review 의존
- `src/mypage/tabs/UsageReportTab.tsx`
  - local project/review/proposal/freelancer 집계 의존

## FE route와 접근 제어 현황
- `main.tsx` manual routing 사용
- 현재 route map
  - `/login`
  - `/register`
  - `/announcement`
  - `/mypage`
  - `/project`
  - `/freelancers`
  - `/freelancers/:id`
  - `/ai-match`
  - `/error`
  - `/`
- 현재 guard
  - 인증 필요: `/mypage`, `/project`
  - 관리자 전용: `/announcement`
- 문제
  - `main.tsx`가 token bootstrap 없이 `getUser()` 동기값만 보고 guard를 수행
  - `/users/me` 기반 세션 복원과 맞지 않음
  - refresh/reissue 재시도 구조가 없음

## FE가 현재 기대하는 주요 DTO shape

### 현재 FE 프로젝트 form
- `title`
- `type`
- `date`
- `time`
- `location`
- `description`

### 현재 FE proposal shape
- `freelancerId`, `freelancerName`
- `projectId`, `projectTitle`, `projectType`
- `date`, `time`, `location`
- `description`
- `userName`, `userEmail`
- `status`

### 현재 FE review shape
- `rating`
- `tags: string[]`
- `content`
- `blinded`
- `reported`
- `reportReason`

### 현재 FE freelancer shape
- `photo`
- `skills`
- `bio`
- `verified`
- `rating`
- `reviewCount`
- `projectCount`
- `availableHours`
- `availableRegions`
- `portfolio`

### 현재 FE notification shape
- `type`
- `title`
- `message`
- `read`
- `link`

## 실제 BE API 계약 요약

### 인증
- `POST /api/v1/auth/login`
  - request: `email`, `password`
  - response: `tokenType`, `accessToken`, `expiresInSeconds`, `refreshToken`, `refreshTokenExpiresInSeconds`, `user`
- `POST /api/v1/auth/refresh`
  - request: `refreshToken`
  - canonical refresh endpoint
- `POST /api/v1/auth/reissue`
  - deprecated alias
- `POST /api/v1/auth/signup`
  - request: `email`, `password`, `name`, `phone`, `intro`
  - response status: `201 Created`
- `POST /api/v1/auth/logout`
  - authenticated endpoint

### 사용자
- `GET /api/v1/users/me`
  - `userId`, `email`, `name`, `phone`, `intro`, `roleCode`, `active`
- `PATCH /api/v1/users/me`
  - profile update
- `GET /api/v1/users/me/mypage`
  - 요약 집계용 composite response

### 프로젝트
- `GET /api/v1/projects/me`
  - response type은 `ProjectListResponse`
  - shape는 사실상 `PageResponse`와 동일
- `POST /api/v1/projects`
  - request:
    - `title`
    - `projectTypeCode`
    - `serviceRegionCode`
    - `requestedStartAt`
    - `requestedEndAt`
    - `serviceAddress`
    - `serviceDetailAddress`
    - `requestDetail`
- `GET /api/v1/projects/{projectId}`
- `PATCH /api/v1/projects/{projectId}`
- `PATCH /api/v1/projects/{projectId}/cancel`
  - request: `reason`
- `PATCH /api/v1/projects/{projectId}/start`
- `PATCH /api/v1/projects/{projectId}/complete`

### 제안
- owner view
  - `GET /api/v1/projects/{projectId}/proposals`
  - response: `PageResponse<ProjectProposalSummaryResponse>`
- owner create
  - `POST /api/v1/projects/{projectId}/proposals`
  - request: `freelancerProfileId`, `message`
- freelancer inbox
  - `GET /api/v1/freelancers/me/proposals`
  - `GET /api/v1/freelancers/me/proposals/{proposalId}`
  - `PATCH /api/v1/freelancers/me/proposals/{proposalId}/accept`
  - `PATCH /api/v1/freelancers/me/proposals/{proposalId}/reject`

### 리뷰/신고
- `POST /api/v1/projects/{projectId}/reviews`
- `GET /api/v1/users/me/reviews`
- `GET /api/v1/users/me/reviews/{reviewId}`
- `PATCH /api/v1/users/me/reviews/{reviewId}`
- `DELETE /api/v1/users/me/reviews/{reviewId}`
- `GET /api/v1/freelancers/{freelancerProfileId}/reviews`
- `GET /api/v1/reviews/tag-codes`
- `POST /api/v1/reviews/{reviewId}/reports`
- `GET /api/v1/reports/me`

### 프리랜서/프로필/파일/검증
- `GET /api/v1/freelancers`
- `GET /api/v1/freelancers/{freelancerProfileId}`
- `POST /api/v1/freelancers/me/profile`
- `GET /api/v1/freelancers/me/profile`
- `PATCH /api/v1/freelancers/me/profile`
- `POST /api/v1/freelancers/me/files`
- `GET /api/v1/freelancers/me/files`
- `DELETE /api/v1/freelancers/me/files/{fileId}`
- `POST /api/v1/freelancers/me/verifications`
- `GET /api/v1/freelancers/me/verifications`
- `GET /api/v1/freelancers/me/verifications/{verificationId}`
- `POST /api/v1/freelancers/me/verifications/{verificationId}/files`
- `GET /api/v1/freelancers/me/verifications/{verificationId}/files`
- `DELETE /api/v1/freelancers/me/verifications/files/{fileId}`

### 알림/공지/코드/파일
- `GET /api/v1/notifications`
- `GET /api/v1/notifications/{notificationId}`
- `PATCH /api/v1/notifications/{notificationId}/read`
- `PATCH /api/v1/notifications/read-all`
- `GET /api/v1/notices`
- `GET /api/v1/notices/{noticeId}`
- `GET /api/v1/codes/project-types`
- `GET /api/v1/codes/regions`
- `GET /api/v1/codes/available-time-slots`
- `GET /api/v1/files/{fileKey}`
- `GET /api/v1/files/{fileKey}/download`

### 관리자
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/verifications`
- `GET /api/v1/admin/verifications/{verificationId}`
- `PATCH /api/v1/admin/verifications/{verificationId}/approve`
- `PATCH /api/v1/admin/verifications/{verificationId}/reject`
- `GET /api/v1/admin/projects`
- `GET /api/v1/admin/projects/{projectId}`
- `PATCH /api/v1/admin/projects/{projectId}/cancel`
- `GET /api/v1/admin/freelancers`
- `GET /api/v1/admin/freelancers/{freelancerProfileId}`
- `PATCH /api/v1/admin/freelancers/{freelancerProfileId}/visibility`
- `PATCH /api/v1/admin/freelancers/{freelancerProfileId}/active`
- `GET /api/v1/admin/reviews`
- `PATCH /api/v1/admin/reviews/{reviewId}/blind`
- `PATCH /api/v1/admin/reviews/{reviewId}/unblind`
- `GET /api/v1/admin/reports`
- `GET /api/v1/admin/reports/{reportId}`
- `PATCH /api/v1/admin/reports/{reportId}/resolve`
- `PATCH /api/v1/admin/reports/{reportId}/reject`
- `POST /api/v1/admin/notices`
- `PATCH /api/v1/admin/notices/{noticeId}/publish`

## 실제 enum/status/type 값
- user role
  - `ROLE_USER`
  - `ROLE_FREELANCER`
  - `ROLE_ADMIN`
- project status
  - `REQUESTED`
  - `ACCEPTED`
  - `IN_PROGRESS`
  - `COMPLETED`
  - `CANCELLED`
- proposal status
  - `PENDING`
  - `ACCEPTED`
  - `REJECTED`
  - `EXPIRED`
  - `CANCELLED`
- notification type
  - `PROPOSAL_RECEIVED`
  - `PROPOSAL_ACCEPTED`
  - `PROJECT_STATUS_CHANGED`
  - `REVIEW_REQUEST`
  - `NOTICE`
  - `VERIFICATION_APPROVED`
  - `VERIFICATION_REJECTED`
- report reason type
  - `SPAM`
  - `ABUSE`
  - `FALSE_INFO`
  - `ETC`
- report status
  - `PENDING`
  - `RESOLVED`
  - `REJECTED`
- verification status
  - `PENDING`
  - `APPROVED`
  - `REJECTED`
- verification type
  - `BASIC_IDENTITY`
  - `LICENSE`
  - `CAREGIVER`

## FE-BE field mismatch 목록

### 인증/회원가입
- FE signup은 `role` 선택을 받고 있지만 BE signup request에는 role field가 없다.
- 실제 role 전환은 freelancer profile 생성 흐름과 맞물린다.
- FE는 email/password만 저장하면 되지만 현재는 mock 계정 배열을 직접 유지한다.

### 프로젝트
- FE
  - `type`, `date`, `time`, `location`, `description`
- BE
  - `projectTypeCode`
  - `serviceRegionCode`
  - `requestedStartAt`
  - `requestedEndAt`
  - `serviceAddress`
  - `serviceDetailAddress`
  - `requestDetail`
- 해결 방향
  - FE form 자체를 canonical DTO에 맞춰 개편
  - `datetime-local` 2개로 시작/종료 시각 분리
  - region code와 실제 주소 입력란 분리

### 프리랜서 목록/상세
- FE는 `skills`, `availableHours`, `availableRegions`, `portfolio`, `photo`를 직접 가진다.
- BE는 code 기반 response를 준다.
  - `activityRegionCodes`
  - `availableTimeSlotCodes`
  - `projectTypeCodes`
  - `verifiedYn`
  - `averageRating`
  - `activityCount`
- 해결 방향
  - code lookup + label formatter를 FE 공통 계층에 추가
  - public detail에는 portfolio file이 없으므로 self/admin API와 분리해서 처리

### 제안
- owner용 proposal 응답과 freelancer inbox 응답 shape가 다르다.
- FE는 현재 하나의 flat proposal interface로 합쳐서 쓰고 있다.
- 해결 방향
  - owner proposal list와 freelancer proposal list를 FE 타입 수준에서 분리
  - 렌더링 전용 adapter를 둔다

### 리뷰
- FE는 `tags`
- BE는 `tagCodes`
- FE는 `blinded`
- BE는 `blindedYn`
- 해결 방향
  - canonical FE review type을 BE 기준으로 통일
  - label 렌더링만 별도 mapper로 처리

### 알림
- FE local type
  - `PROJECT_STATUS`
  - `FREELANCER_STATUS`
  - `ANNOUNCEMENT`
- BE canonical type
  - `PROPOSAL_RECEIVED`
  - `PROPOSAL_ACCEPTED`
  - `PROJECT_STATUS_CHANGED`
  - `REVIEW_REQUEST`
  - `NOTICE`
  - `VERIFICATION_APPROVED`
  - `VERIFICATION_REJECTED`
- 해결 방향
  - FE에서 notificationType을 canonical string 그대로 사용
  - 화면 label만 mapper로 변환

### 공지
- FE에는 `announcementType`, `target`, `scheduledAt`이 있다.
- BE admin notice는 `title`, `content`, `publishNow`만 받는다.
- public notice는 조회 전용이다.
- 해결 방향
  - public notice view와 admin publish/create view를 분리
  - local scheduling/target 개념 제거

## 인증 흐름 차이
- 현재 FE
  - localStorage에 `auth_user` 저장
  - `main.tsx`에서 동기 `getUser()`로 route guard 수행
- 실제 BE
  - login 성공 시 access/refresh token 발급
  - `/users/me`로 사용자 복원
  - `/auth/refresh`로 refresh token rotation
- 필요한 전환
  - `src/auth/tokenStorage.ts`
  - `src/auth/authSession.ts`
  - bootstrap 시 `/users/me`
  - 401 시 refresh 후 원 요청 1회 재시도
  - refresh 실패 시 세션 제거 후 로그인 이동

## 페이지네이션 차이
- 공통 page shape
  - `content`
  - `page`
  - `size`
  - `totalElements`
  - `totalPages`
  - `hasNext`
- 주의
  - `NotificationListResponse`는 위 page shape + `unreadCount`
  - `ProjectListResponse`, `FreelancerListResponse`, `ProposalListResponse`는 이름은 다르지만 사실상 같은 page contract
- FE 대응
  - 공통 `PageResult<T>` 타입과 paging helper 필요

## 파일 업로드/다운로드 차이
- FE는 현재 file API를 거의 사용하지 않는다.
- BE는 portfolio/verification file 업로드 후
  - `viewUrl`
  - `downloadUrl`
  - 또는 `fileKey` 기반 `/api/v1/files/*`
  - 로 접근한다.
- FE 대응
  - multipart helper 추가
  - API base URL과 상대 view/download URL 결합
  - stored path는 UI에 노출하지 않고 `originalFilename`만 보여준다

## 알림/공지/관리자 기능 차이
- FE 관리자 화면은 현재 local aggregation 기반이다.
- BE는 dashboard/list/detail/action이 모두 준비되어 있다.
- FE 알림 센터는 local event와 local unread count에 묶여 있다.
- 공지 화면은 실제로는 admin notice management + public notice browsing 두 역할로 분리되어야 한다.

## 실제 수정 계획

### 1. FE 공통 계층 추가
- `src/api/client.ts`
- `src/api/auth.ts`
- `src/api/users.ts`
- `src/api/projects.ts`
- `src/api/proposals.ts`
- `src/api/freelancers.ts`
- `src/api/reviews.ts`
- `src/api/reports.ts`
- `src/api/verifications.ts`
- `src/api/notices.ts`
- `src/api/notifications.ts`
- `src/api/admin.ts`
- `src/api/files.ts`
- `src/api/codes.ts`
- `src/auth/tokenStorage.ts`
- `src/auth/authSession.ts`
- `src/auth/useAuthBootstrap.ts`

### 2. app/store 역할 정리
- `appAuth.ts`
  - mock 계정 저장소 제거
  - session facade 또는 타입/event helper로 축소
- `appProjectStore.ts`, `appProposalStore.ts`, `appReviewStore.ts`, `appFreelancerStore.ts`, `notificationStore.ts`
  - domain data 저장소 역할 제거
  - 필요한 타입/label helper만 남기거나 api adapter로 교체

### 3. 인증/헤더/부트스트랩 전환
- `main.tsx`
  - bootstrap 로딩 상태 도입
  - `/users/me` 복원 후 route 판단
- `Login.tsx`
  - `/auth/login` + `/users/me`
- `RegisterPage.tsx`
  - `/auth/signup`
- `AppHeader.tsx`, `AppHeader.svelte`
  - 실제 세션/알림 API 기반

### 4. 도메인 페이지 전환
- 프로젝트 페이지
  - `/projects/me`, `/projects`, `/projects/{id}`, `/projects/{id}/cancel`, `/start`, `/complete`
  - `/projects/{id}/proposals`
  - `/projects/{id}/reviews`
- 프리랜서 페이지
  - `/freelancers`
  - `/freelancers/{id}`
  - `/freelancers/{id}/reviews`
  - `/projects/me` 기반 제안 보내기
- 마이페이지
  - `/users/me`
  - `/users/me/mypage`
  - `/users/me/reviews`
  - `/reports/me`
  - `/freelancers/me/profile`
  - `/freelancers/me/files`
  - `/freelancers/me/verifications`
- 알림/공지
  - `/notifications`
  - `/notices`
- 관리자
  - `/admin/dashboard`
  - `/admin/verifications`
  - `/admin/projects`
  - `/admin/freelancers`
  - `/admin/reviews`
  - `/admin/reports`
  - `/admin/notices`

### 5. BE 최소 보완 체크 포인트
- refresh endpoint는 `/auth/refresh`를 canonical로 사용
- `/auth/reissue`는 deprecated alias로 유지
- code lookup API는 이미 존재하므로 FE만 연결
- CORS allowed origins는 `5173`, `3000` 포함 확인 완료
- 실제 구현 중 FE에서 바로 쓰기 어려운 응답 누락이 있으면 DTO 최소 보완

### 6. 검증
- FE
  - `npm run build`
  - `npm run lint`
  - dev server 기동 확인
- BE
  - `./mvnw -q -DskipTests compile`
  - `./mvnw test`
  - local profile/Oracle profile 기동 확인
- smoke
  - auth
  - user bootstrap
  - project/proposal/review/report
  - freelancer/profile/files/verifications
  - notification/notice
  - admin flows
