'use client';

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
// 배치·글자 크기는 사용자 상세의 댓글 목록(BoardComments)과 같게 맞췄다.
// 답글·수정·신고 버튼과 대댓글 들여쓰기는 없다 (관리자는 읽기만 하고,
// 상세 응답에 parentCommentId 가 없어 트리를 만들 수도 없다).
//
// comment: { commentId, content, userId, authorName, isAnonymous, isPrivate,
//            state, created, updated }
export default function PostDetailComments({ comments = [], focusedAnchor = null }) {
  const list = Array.isArray(comments) ? comments : [];

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
          {list.map((comment) => {
            const anchorId = getCommentAnchorId(comment.commentId);

            return (
              <div
                // 댓글 관리의 '원글' 링크가 #comment-{id} 로 이 항목을 짚는다.
                // scroll-mt 는 강조된 댓글이 화면 맨 위에 붙지 않게 띄워준다.
                id={anchorId}
                key={comment.commentId}
                className={`flex w-full scroll-mt-[100px] flex-col gap-[7px] border-b border-[#dedede] px-[8px] py-4 transition-colors md:py-5 ${
                  focusedAnchor === anchorId ? 'bg-[#f5f5f5]' : ''
                }`}
              >
                {/* 익명 댓글도 관리자에게는 실작성자가 보인다 (서버가 마스킹하지 않는다).
                    상태는 게시글 상태와 같이 테두리로 감싼다 — 글자만 두면
                    '테스트재학생 삭제'처럼 작성자 이름의 일부로 읽힌다.
                    응답에는 isAnonymous · isPrivate 도 있지만 보여주지 않는다.
                    둘 다 조치 판단을 바꾸지 않는다 (벌점은 익명이어도 실작성자에게 가고,
                    비밀댓글도 관리자는 내용을 읽고 판단한다). */}
                <div className="flex flex-wrap items-center gap-x-[8px] gap-y-[4px]">
                  <span className="text-[16px] leading-[26px] tracking-[-0.32px] text-[#454545]">
                    {comment.authorName}
                  </span>
                  <StateChip label={getCommentStateLabel(comment.state)} />
                </div>

                <p className="whitespace-pre-line break-words text-[16px] leading-[26px] tracking-[-0.32px] text-[#454545]">
                  {comment.content}
                </p>

                <span className="text-[14px] leading-[22px] tracking-[-0.28px] text-[#919191]">
                  {formatSlashDateTime(comment.updated ?? comment.created)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
