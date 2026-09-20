'use client';

import { useMemo } from 'react';
import { CornerDownRight, Lock } from 'lucide-react';

import StateChip from '@/components/shared/board/boardDetail/StateChip';
import { getCommentAnchorId } from '@/lib/utils';
import { formatSlashDateTime } from '@/lib/boardDetail';
import { getCommentStateLabel } from '@/constants/adminComments';

// 관리자 게시글 상세의 댓글 목록 (읽기 전용).
//
// 상세 응답의 comments[] 는 모든 상태(normal · blind · deleted)를 담고 있다.
// 사용자 화면에서는 가려지는 댓글까지 다 보이므로, 글 전체를 놓고 조치를 판단할 수 있다.
// 조치 자체는 댓글 관리 화면에서 한다 — 여기서는 손대지 않는다.
//
// 답글은 부모 아래에 들여서 보여 준다 (parentCommentId, 2026-09-20 부터 응답에 있다).
// 부모가 목록에 없는 답글(부모가 물리 삭제된 경우 등)은 맨 위 층으로 올린다 — 안 보이는 것보다 낫다.
//
// comment: { commentId, parentCommentId, content, userId, authorName, isAnonymous, isPrivate,
//            state, created, updated }
export default function PostDetailComments({ comments = [], focusedAnchor = null }) {
  const list = Array.isArray(comments) ? comments : [];

  // 부모 → 답글들. 서버가 등록순으로 주므로 그 순서를 그대로 지킨다
  const ordered = useMemo(() => {
    const ids = new Set(list.map((c) => c.commentId));
    const children = new Map();
    const roots = [];
    for (const comment of list) {
      const parentId = comment.parentCommentId;
      if (parentId && ids.has(parentId)) {
        if (!children.has(parentId)) children.set(parentId, []);
        children.get(parentId).push(comment);
      } else {
        roots.push(comment);
      }
    }
    const out = [];
    const walk = (comment, depth) => {
      out.push({ comment, depth });
      (children.get(comment.commentId) ?? []).forEach((child) => walk(child, depth + 1));
    };
    roots.forEach((root) => walk(root, 0));
    return out;
  }, [list]);

  return (
    <section className="flex w-full flex-col gap-4 md:gap-[20px]">
      <h2 className="text-[18px] font-semibold tracking-[-0.36px] text-[#212121] md:text-[20px]">
        댓글 {list.length.toLocaleString()}
      </h2>

      {list.length === 0 ? (
        <p className="border-t border-[#dedede] py-[24px] text-center text-[15px] tracking-[-0.3px] text-[#919191]">
          댓글이 없습니다.
        </p>
      ) : (
        <div className="flex w-full flex-col border-t border-[#dedede]">
          {ordered.map(({ comment, depth }) => {
            const anchorId = getCommentAnchorId(comment.commentId);
            const isReply = depth > 0;

            return (
              <div
                // 댓글 관리의 '원글' 링크가 #comment-{id} 로 이 항목을 짚는다.
                // scroll-mt 는 강조된 댓글이 화면 맨 위에 붙지 않게 띄워준다.
                id={anchorId}
                key={comment.commentId}
                className={`flex w-full scroll-mt-[100px] gap-[8px] border-b border-[#dedede] py-4 pr-[8px] transition-colors md:py-5 ${
                  isReply ? 'bg-[#FAFAFA] pl-[20px] md:pl-[36px]' : 'pl-[8px]'
                } ${focusedAnchor === anchorId ? '!bg-[#f0f0f0]' : ''}`}
              >
                {/* 답글 표식 — 사용자 화면(BoardComments)과 같은 꺾인 화살표 */}
                {isReply && (
                  <CornerDownRight
                    size={18}
                    strokeWidth={1.6}
                    aria-label="답글"
                    className="mt-[4px] shrink-0 text-[#919191]"
                  />
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
                  {/* 익명 댓글도 관리자에게는 실작성자가 보인다 (서버가 마스킹하지 않는다).
                      비밀 댓글은 자물쇠로만 알린다 — 조치 판단은 내용으로 하니 내용은 그대로 보여 준다 */}
                  <div className="flex flex-wrap items-center gap-x-[6px] gap-y-[4px]">
                    <span className="text-[16px] leading-[26px] tracking-[-0.32px] text-[#454545]">
                      {comment.authorName}
                    </span>
                    {comment.isPrivate && (
                      <Lock
                        size={13}
                        strokeWidth={1.8}
                        aria-label="비밀 댓글"
                        className="shrink-0 text-[#757575]"
                      />
                    )}
                    <StateChip label={getCommentStateLabel(comment.state)} />
                  </div>

                  <p className="whitespace-pre-line break-words text-[16px] leading-[26px] tracking-[-0.32px] text-[#454545]">
                    {comment.content}
                  </p>

                  <span className="text-[14px] leading-[22px] tracking-[-0.28px] text-[#919191]">
                    {formatSlashDateTime(comment.updated ?? comment.created)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
