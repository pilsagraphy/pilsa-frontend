# apis 폴더 — API 연동 작업 분배

기준 명세서: `sql-result-20260823-1610.csv` (endpoint 88건 — active 84 / planned 4)

각 파일에는 **주석으로 API 목록만** 적혀 있다. 담당자가 그 주석을 그대로 함수로 채운다.
구현 스타일은 `mail.js` · `notification.js` 를 따른다.

```js
// 1. 무슨 API (METHOD /경로) [권한]
export const doSomething = async (arg) => {
  const response = await axiosInstance.get('/api/...');
  return response.data;
};
```

---

## 1. 폴더 구조

```
apis/
├── axiosInstance.js      공통 인스턴스 (수정 금지 — 토큰 재발급 인터셉터 포함)
├── authApi.js            구 인스턴스 (정리 대상, 아래 5번 참고)
│
├── auth.js               ✅ 연동됨  로그인/회원가입/토큰/아이디·비번 찾기
├── mail.js               ✅ 연동됨  이메일 인증번호
├── notification.js       ✅ 연동됨  알림함 + 알림 수신 기기 (수정 금지)
├── mypage.js             🔨 일부     마이페이지 (탈퇴만 연동됨)
│
├── board.js              🆕 공통게시판 — 게시판 목록/카테고리/게시글 CRUD/좋아요
├── comment.js            🆕 댓글·대댓글
├── file.js               🆕 파일 업로드 + 인증형 조회(blob)
├── draft.js              🆕 임시저장(초안)
├── report.js             🆕 신고 접수 + 사유 목록
├── quote.js              🆕 이 주의 문장 (메인)
├── event.js              ✅ 연동됨  일정(캘린더) 목록 (ICS 는 axios 미사용)
├── donation.js           🆕 명예의 전당
│
├── admin/
│   ├── dashboard.js      🆕 통계 / 최근 신고 / 최근 가입
│   ├── boards.js         🆕 게시판 관리
│   ├── posts.js          🆕 게시글 관리
│   ├── comments.js       🆕 댓글 관리
│   ├── reports.js        🆕 신고 관리 + 일괄 조치(select-*)
│   ├── sanctions.js      🆕 제재 회원
│   ├── users.js          🆕 회원 목록/정지/차단/강제탈퇴
│   ├── quotes.js         🆕 문장 관리
│   └── event.js          ✅ 연동됨  일정 등록/수정/삭제
│
└── (교체 대상)
    ├── free.js           ❌ /api/stu/free/**     → board.js
    ├── info.js           ❌ /api/stu/info/**     → board.js
    ├── notice.js         ❌ /api/stu/notices/**  → board.js
    └── honor.js          ❌ /api/public/honor/    → donation.js
    (schedule.js 는 event.js 로 교체 완료 — 삭제됨)
```

---

## 3. 전 작업 공통 규칙

- **게시판은 하드코딩 금지.** 메뉴·경로는 `GET /api/user/boards` 응답으로 그린다.
  `free` / `info` / `notice` 같은 고정 slug 를 새로 만들지 않는다.
- **첨부 정적 서빙은 폐지됐다.** 모든 파일은 `GET /api/user/files/{id}` (Authorization 필수)
  로 받아 blob 으로 표시한다. 응답의 `fileUrl` 을 `<img src>` 에 그대로 넣으면 안 된다.
  예외: 명예의 전당 사진(`/uploads/Honor/**`)만 공개 정적 서빙 유지.
- **마스킹은 서버 책임.** 익명/비밀 처리를 프론트에서 다시 하지 않는다.
- **삭제는 대부분 `PATCH .../delete`** (소프트 삭제). `DELETE` 메서드를 쓰는 건
  임시저장(물리 삭제)과 관리자 일정(이름만 DELETE, 실제는 소프트)뿐이다.
- **응답에 실린 상태값을 그대로 쓴다.** `unreadCount`, 수정 후 게시판 객체 등을
  받아 쓰고 목록을 재조회하거나 값을 추측하지 않는다.
- 에러 메시지는 `auth.js` 의 `getErrorMessage(error, fallback)` 를 재사용한다.

---

## 4. 백엔드 대기 (연동 불가 — 화면만 준비)

| 엔드포인트                                  | 파일                   | 상태                                                 |
| ------------------------------------------- | ---------------------- | ---------------------------------------------------- |
| `GET /api/user/mypage/posts`                | `mypage.js` 5          | planned (백로그 C-2)                                 |
| `GET /api/user/mypage/comments`             | `mypage.js` 6          | planned (백로그 C-2)                                 |
| `GET /api/user/mypage/likes`                | `mypage.js` 7          | planned (백로그 C-2)                                 |
| `GET /api/event/{eventId}`                  | `event.js` 4           | planned — 목록이 description 까지 주므로 없이도 가능 |
| `GET /api/event/categories`                 | `event.js` 5           | planned — 없으면 일정 카테고리 셀렉트바를 못 그린다  |
| `POST /api/admin/sanctions/users/{id}/lift` | `admin/sanctions.js` 5 | 3기 진행 예정                                        |

---

## 5. 확인·정리가 필요한 기존 코드

1. **`mail.js` 검증 응답 처리** — 경로는 `/api/mail/verification-code` 로 교체 완료.
   다만 검증 실패가 `200 + false` 가 아니라 `400 + message` 이므로,
   `verifyEmailCode` 를 호출하는 화면이 반환값의 boolean 을 보고 있으면 catch 로 옮겨야 한다.
2. **`auth.js` 이메일 찾기** — 스텁은 `GET ?loginId=`, 확정 스펙은 `POST { studentNo, name }`.
   함수명도 `findEmailByStudentNo` 로 맞춘다.
3. **`authApi.js`** — `axiosInstance.js` 와 역할이 겹친다. 토큰 재발급 인터셉터가 없어
   401 처리가 안 되므로 사용처를 `axiosInstance` 로 옮기고 제거한다.
4. **구 파일 4개** (`free` `info` `notice` `honor`) — 화면 전환이 끝나면 삭제.
   `schedule.js` 는 `event.js` 로 교체하고 삭제했다.
5. **일정 폼의 시각 · 종일 UI** — 서버에 담을 곳이 없어 저장되지 않는다. 마크업은 그대로
   두기로 했으므로, 카테고리 목록 API(4번 표)와 함께 PM 확인 후 숨기거나 살릴 것.
   `ScheduleForm` 상단 주석에 같은 내용을 적어 뒀다.
   근거(2026-08-25 `GET /v3/api-docs` 확인) — 등록 · 수정 요청 본문 필드는
   `title` `category` `description` `startDate` `endDate` 5개뿐이고 시각 관련 필드가 없다.
   `/api/event/categories` 와 `GET /api/event/{eventId}` 도 아직 스펙에 없다(planned 유지).
   덤으로 등록 요청 본문에 `eventId` 가 끼어 있는데(DTO 공용 흔적) 보내지 않는다.
6. **`mocks/calendarData.js` 의 `calendarMockResponse`** — 조회 실패 시 목 데이터로 메꾸던
   fallback 을 걷어내서 지금은 쓰이는 곳이 없다. `/calendar/mock` 페이지를 지울 때 함께 정리.
