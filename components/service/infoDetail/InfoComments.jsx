'use client';

import React, { useState } from 'react';
import InfoComment from './InfoComment';

function Divider() {
  return <div className="w-full h-px bg-[#DEDEDE]" />;
}

export default function InfoComments({ comments = [] }) {
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSecret, setIsSecret] = useState(false);

  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId) => comments.filter((c) => c.parentId === parentId);

  const handleSubmit = () => {
    if (!commentText.trim()) return;
    console.log('댓글 작성:', { content: commentText, anonymous: isAnonymous, secret: isSecret });
    setCommentText('');
  };

  return (
    <section className="flex flex-col gap-[60px] w-full">
      {/* 댓글 목록 */}
      <div className="flex flex-col gap-[23px] items-center w-full">
        <div className="w-full px-[20px] py-[10px]">
          <span className="text-[18px] tracking-[-0.36px] text-[#454545] leading-[1.6]">
            댓글 {comments.length}개
          </span>
        </div>

        {rootComments.map((comment, idx) => {
          const replies = getReplies(comment.commentId);
          return (
            <React.Fragment key={comment.commentId}>
              {idx !== 0 && <Divider />}
              <InfoComment comment={comment} isReply={false} />
              {replies.map((reply) => (
                <React.Fragment key={reply.commentId}>
                  <Divider />
                  <InfoComment comment={reply} isReply={true} />
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        })}
        {comments.length > 0 && <Divider />}
      </div>

      {/* 댓글 입력 */}
      <div className="flex flex-col gap-[20px] w-full">
        <div className="flex items-center gap-[20px] w-full">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 작성하세요."
            className="flex-1 h-[52px] bg-white border border-[#b9b9b9] rounded-[4px] px-[16px] text-[16px] tracking-[-0.32px] text-[#212121] placeholder:text-[#919191] outline-none focus:border-[#919191]"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px] text-[16px] tracking-[-0.32px] shrink-0"
          >
            댓글 작성
          </button>
        </div>

        {/* 익명 + 비밀 댓글 체크박스 */}
        <div className="flex items-center gap-[20px]">
          <div className="flex items-center gap-[8px]">
            <input
              type="checkbox"
              id="info-anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-[24px] h-[24px] border border-[#919191] rounded-[2px] cursor-pointer accent-[#212121]"
            />
            <label
              htmlFor="info-anonymous"
              className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[1.6] cursor-pointer"
            >
              익명
            </label>
          </div>
          <div className="flex items-center gap-[8px]">
            <input
              type="checkbox"
              id="info-secret"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              className="w-[24px] h-[24px] border border-[#919191] rounded-[2px] cursor-pointer accent-[#212121]"
            />
            <label
              htmlFor="info-secret"
              className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[1.6] cursor-pointer"
            >
              비밀 댓글
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
