// 관리자 - 게시글 관리 API 처리
// ※ 블라인드/삭제/복원 조치는 apis/admin/reports.js 의 select-* 를 targetType='post' 로 호출
import axiosInstance from '@/apis/axiosInstance';

// 1. 게시글 목록 - 전 게시판 (GET /api/admin/posts) [ADMIN]
//    쿼리: page, size, boardId, keyword(제목 또는 글쓴이)
//    응답: { totalPages, totalCount, posts: [{ postId, boardId, boardName, title,
//           authorName, commentCount, likeCount, viewCount, created, state }] }
//    state: normal | blind (deleted 는 목록에서 제외)

// 2. 게시글 상세 (GET /api/admin/posts/{postId}) [ADMIN]
//    응답: { postId, boardId, boardName, categoryName, title, content,
//           authorId, authorName, isAnonymous, isPinned, viewCount, likeCount,
//           commentCount, state, created, updated, attachments[], comments[] }
//    익명글도 실작성자가 노출된다. 모든 state 의 댓글이 포함되고 조회수는 증가하지 않는다
//    블라인드/삭제 글의 첨부도 GET /api/user/files/{id} 로 열람 가능 (file.js)
