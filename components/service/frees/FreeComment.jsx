'use client';

import React from 'react';

function formatDate(isoString) {
  if (!isoString) return '';
  if (isoString.includes('/')) return isoString;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function ReplyIcon() {
  return (
    <div
      className="shrink-0"
      style={{
        width: '14px',
        height: '14px',
        borderLeft: '1px solid #919191',
        borderBottom: '1px solid #919191',
      }}
    />
  );
}

function MenuIcon() {
  return (
    <svg width="2" height="12" viewBox="0 0 2 12" fill="none" aria-hidden="true">
      <circle cx="1" cy="1" r="1" fill="#919191" />
      <circle cx="1" cy="6" r="1" fill="#919191" />
      <circle cx="1" cy="11" r="1" fill="#919191" />
    </svg>
  );
}

export default function FreeComment({ comment, isReply = false }) {
  const displayContent = comment.private ? '비밀 댓글입니다.' : comment.content;
  const displayAuthor = comment.authorName ?? '익명';

  return (
    <div className="flex items-start justify-between px-[40px] py-[16px] w-full">
      <div className="flex flex-col gap-[7px]">
        {/* 작성자 */}
        <div className="flex items-start gap-[16px]">
          {isReply && <ReplyIcon />}
          <span className="text-[16px] tracking-[-0.32px] text-[#454545] leading-[1.6]">
            {displayAuthor}
          </span>
        </div>

        {/* 내용 + 날짜 */}
        <div className={['flex flex-col gap-[7px]', isReply ? 'pl-[30px]' : ''].join(' ')}>
          <p className="text-[16px] tracking-[-0.32px] text-[#454545] leading-[1.6]">
            {displayContent}
          </p>
          <span className="text-[14px] tracking-[-0.28px] text-[#919191] leading-[1.6]">
            {formatDate(comment.updated)}
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label="댓글 메뉴"
        className="mt-[4px] overflow-clip relative size-[24px] flex items-center justify-center"
        onClick={() => console.log('댓글 메뉴 클릭', comment.commentId)}
      >
        <MenuIcon />
      </button>
    </div>
  );
}
