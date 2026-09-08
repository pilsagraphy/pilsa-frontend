// 관리자 - 댓글 관리 상수
//
// 목록은 GET /api/admin/comments 응답을 쓴다 (더미 데이터 없음).
// 서버 응답: { commentId, postId, boardId, boardName, authorName, content, created, state }
//
// 상태 라벨은 게시글 관리와 같은 값이라 가져다 쓴다.
// (게시판 필터는 두 화면이 공유하는 useAdminModerationList 가 직접 adminPosts 에서 가져간다)
import {
  DETAIL_FROM_COMMENTS,
  DETAIL_FROM_PARAM,
  POST_STATES,
  getPostStateLabel,
} from './adminPosts';
import { ROUTES } from './routes';
import { getCommentAnchorId } from '@/lib/utils';

// 호출부에서 어색하지 않도록 댓글 쪽 이름으로도 내보낸다.
export const COMMENT_STATES = POST_STATES;
export const getCommentStateLabel = getPostStateLabel;

// '원글' 열의 링크.
// 관리자 게시글 상세로 보내고 해시로 그 댓글까지 짚어준다.
//  - 사용자 상세로 보내면 블라인드·삭제된 댓글은 아예 그려지지 않아 확인할 수 없다
//  - 관리자 상세는 모든 상태의 댓글을 내려주므로 어떤 댓글이든 찾아갈 수 있다
// from=comments 를 달아 보내야 상세의 '돌아가기'가 게시글 관리가 아니라
// 댓글 관리로 되돌린다. 쿼리는 해시보다 앞에 와야 한다.
export const getCommentOriginHref = (postId, commentId) => {
  if (postId == null) return null;

  const href = `${ROUTES.ADMIN_POST_DETAIL(postId)}?${DETAIL_FROM_PARAM}=${DETAIL_FROM_COMMENTS}`;
  return commentId != null ? `${href}#${getCommentAnchorId(commentId)}` : href;
};
