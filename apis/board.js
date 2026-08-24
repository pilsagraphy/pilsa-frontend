// 공통게시판 관련 API 처리 (게시판 목록 / 카테고리 / 게시글 CRUD)
// ※ free.js · info.js · notice.js 를 대체하는 통합 게시판 API
//    게시판은 DB 로 정의되므로 boardId 를 받아 동작한다 (메뉴·경로 하드코딩 금지)
import axiosInstance from '@/apis/axiosInstance';

// ─────────────────────────── 게시판 ───────────────────────────

// 1. 사이드바 게시판 목록 (GET /api/user/boards) [MEMBER]
//    응답: [{ boardId, boardName, displayOrder }]
//    현재 로그인한 사람이 열람 가능한 게시판만 내려온다 — FE 메뉴는 이 API 로 그린다

// 2. 게시판 카테고리 목록 (GET /api/user/boards/{boardId}/categories) [MEMBER]
//    응답: [{ categoryId, name }]
//    '중요'(code=PINNED) 카테고리는 관리자에게만 노출된다

// ─────────────────────────── 게시글 목록 ───────────────────────────

// 3. 게시글 목록 (GET /api/user/boards/{boardId}/posts) [MEMBER]
//    쿼리: page, size, categoryId, keyword, sort(created|viewCount)
//    응답: { totalPages, totalCount, posts: [{ postId, title, authorName, likeCount,
//           viewCount, commentCount, categoryName, isPinned, isAnonymous,
//           hasAttachment, created }] }
//    익명글 authorName 은 서버가 '익명'으로 마스킹한다
//    hasAttachment(클립 아이콘)는 첨부 목록 파일만 기준 — 본문 인라인 이미지는 제외

// 4. 상단 N개 게시글 (GET /api/user/boards/{boardId}/posts/top/{num}) [MEMBER]
//    경로변수: num = 1~50 (범위 밖이면 400)
//    응답: [{ postId, title, isPinned }] — 중요(isPinned) 글 우선, 그다음 최신순

// ─────────────────────────── 게시글 상세 / 작성 ───────────────────────────

// 5. 게시글 상세 (GET /api/user/boards/{boardId}/posts/{postId}) [MEMBER]
//    응답: { postId, boardId, title, content, userId, authorName, categoryName,
//           isAnonymous, isPinned, viewCount, likeCount, isLiked, commentCount,
//           created, updated, prevPost, nextPost, attachments, attachmentCount }
//    댓글 본문은 내려오지 않는다 → comment.js 의 목록 API 로 따로 조회
//    prevPost/nextPost 는 첫 글·마지막 글이면 null
//    attachments 에 본문 삽입 이미지(usage=inline)는 포함되지 않는다
//    attachments[].fileUrl 은 인증형 API 주소 → file.js 로 fetch 후 blob 표시

// 6. 게시글 등록 (POST /api/user/boards/{boardId}/posts) [MEMBER]
//    multipart/form-data: title(필수, 200자), content(필수, 마크다운),
//                         categoryId, isAnonymous,
//                         attachmentIds[](선업로드 파일 연결 — 권장),
//                         files[](이 요청에 함께 올리는 첨부 — 기존 방식),
//                         draftId(임시저장을 발행할 때만)
//    응답: { message, postId }
//    상단 고정은 isPinned 요청이 아니라 '중요' 카테고리 선택으로 서버가 결정한다
//    draftId 를 보내면 발행 성공과 같은 트랜잭션에서 해당 초안이 삭제된다

// 7. 게시글 수정 (PUT /api/user/boards/{boardId}/posts/{postId}) [MEMBER · 작성자/관리자]
//    multipart/form-data: title, content, categoryId, isAnonymous,
//                         deleteAttachmentIds[](삭제할 기존 첨부만),
//                         attachmentIds[](수정 중 새로 선업로드한 파일),
//                         files[]
//    응답: { message } — 수정 후 상세를 다시 GET 하므로 객체를 반환하지 않는다
//    유지할 기존 첨부는 아무것도 보내지 않는다 (증분 방식)
//    본문에서 지운 인라인 이미지는 서버가 함께 삭제한다 (마크다운이 기준)

// 8. 게시글 삭제 (PATCH /api/user/boards/{boardId}/posts/{postId}/delete) [MEMBER · 본인만]
//    응답: { message } — 소프트 삭제

// 9. 좋아요 토글 (PATCH /api/user/boards/{boardId}/posts/{postId}/like) [MEMBER]
//    응답: { message } — '좋아요 +1' 또는 '좋아요 취소'
