'use client';

import RowActionButton from '@/components/shared/admin/RowActionButton';
import { AdminCard, AdminCardList } from '@/components/shared/admin/AdminCardList';
import { formatShortDotDate } from '@/lib/boardDetail';
import { POST_STATES, getAdminPostDetailHref, getPostStateLabel } from '@/constants/adminPosts';

// 좁은 화면의 게시글 관리 목록. 열 10개짜리 표 대신 글 하나를 카드 하나로 세운다.
// 조치(블라인드·삭제·신고 관리로 이동)는 표와 똑같이 동작한다.
export default function PostCardList({
  posts = [],
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
      {posts.map((post) => {
        const isBlinded = post.state === POST_STATES.BLIND;

        return (
          <AdminCard
            key={post.postId}
            selected={selectedIds.includes(post.postId)}
            onSelectChange={(checked) => onSelectOne?.(post.postId, checked)}
            selectLabel={`${post.title} 선택`}
            title={post.title}
            titleHref={getAdminPostDetailHref(post.postId)}
            stateLabel={getPostStateLabel(post.state)}
            metaRows={[
              { label: '게시판', value: post.boardName },
              { label: '글쓴이', value: post.authorName },
              {
                label: '댓글 · 좋아요 · 조회',
                value: `${post.commentCount ?? 0} · ${post.likeCount ?? 0} · ${post.viewCount ?? 0}`,
              },
              { label: '작성일', value: formatShortDotDate(post.created) },
            ]}
            actions={
              isBlinded ? (
                <RowActionButton disabled={disabled} onClick={() => onMoveToReport?.(post)}>
                  신고 관리로 이동
                </RowActionButton>
              ) : (
                <>
                  <RowActionButton disabled={disabled} onClick={() => onBlind?.(post)}>
                    블라인드
                  </RowActionButton>
                  <RowActionButton filled disabled={disabled} onClick={() => onDelete?.(post)}>
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
