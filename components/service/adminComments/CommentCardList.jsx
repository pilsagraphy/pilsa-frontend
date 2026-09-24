'use client';

import Link from 'next/link';

import RowActionButton from '@/components/shared/admin/RowActionButton';
import { AdminCard, AdminCardList } from '@/components/shared/admin/AdminCardList';
import { formatShortDotDate } from '@/lib/boardDetail';
import {
  COMMENT_STATES,
  getCommentOriginHref,
  getCommentStateLabel,
} from '@/constants/adminComments';

// 좁은 화면의 댓글 관리 목록.
// 표에서는 원글 열이 'Link' 라는 글자 하나였다 — 카드에는 자리가 있어 '원글 보기'로 풀어 쓴다.
export default function CommentCardList({
  comments = [],
  selectedIds = [],
  onSelectOne,
  onBlind,
  onDelete,
  onMoveToReport,
  disabled = false,
  emptyMessage = '',
}) {
  return (
    <AdminCardList emptyMessage={emptyMessage}>
      {comments.map((comment) => {
        const isBlinded = comment.state === COMMENT_STATES.BLIND;
        const originHref = getCommentOriginHref(comment.postId, comment.commentId);

        return (
          <AdminCard
            key={comment.commentId}
            selected={selectedIds.includes(comment.commentId)}
            onSelectChange={(checked) => onSelectOne?.(comment.commentId, checked)}
            selectLabel={`${comment.authorName}님의 댓글 선택`}
            title={comment.content}
            stateLabel={getCommentStateLabel(comment.state)}
            metaRows={[
              { label: '게시판', value: comment.boardName },
              { label: '글쓴이', value: comment.authorName },
              { label: '작성일', value: formatShortDotDate(comment.created) },
              {
                label: '원글',
                value: originHref ? (
                  <Link href={originHref} className="underline underline-offset-2">
                    원글 보기
                  </Link>
                ) : (
                  '-'
                ),
              },
            ]}
            actions={
              isBlinded ? (
                <RowActionButton disabled={disabled} onClick={() => onMoveToReport?.(comment)}>
                  신고 관리로 이동
                </RowActionButton>
              ) : (
                <>
                  <RowActionButton disabled={disabled} onClick={() => onBlind?.(comment)}>
                    블라인드
                  </RowActionButton>
                  <RowActionButton filled disabled={disabled} onClick={() => onDelete?.(comment)}>
                    삭제
                  </RowActionButton>
                </>
              )
            }
          />
        );
      })}
    </AdminCardList>
  );
}
