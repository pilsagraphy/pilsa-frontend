import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 디자인의 회원 표기 형식: 로그인ID / 학번 / 이름
// 서버가 주지 않는 값은 자동으로 생략된다. (신고 모달 · 관리자 조치 모달이 함께 쓴다)
export function formatMemberLabel(user) {
  return [user?.loginId, user?.studentId, user?.name].filter(Boolean).join(' / ');
}

// 댓글 하나를 가리키는 DOM id / URL 해시.
// 댓글은 별도 상세 페이지가 없어서 원글 주소 + 해시로만 특정할 수 있다.
// 링크를 만드는 쪽(관리자 신고 관리), id를 붙이는 쪽(게시판 댓글 목록),
// 해시를 알아보는 쪽(useCommentAnchor)이 같은 규칙을 쓰도록 여기 한 곳에 둔다.
export const COMMENT_ANCHOR_PREFIX = 'comment-';

export function getCommentAnchorId(commentId) {
  return `${COMMENT_ANCHOR_PREFIX}${commentId}`;
}
