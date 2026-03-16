'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

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

export default function InfoComment({ comment, isReply = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const displayContent = comment.private ? '비밀 댓글입니다.' : comment.content;
  const displayAuthor = comment.authorName ?? '익명';

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* 더보기 버튼 + 드롭다운 */}
      <div className="relative mt-[4px]" ref={menuRef}>
        <button
          type="button"
          aria-label="댓글 메뉴"
          className="overflow-clip relative size-[24px] flex items-center justify-center"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <MoreVertical size={16} color="#919191" strokeWidth={2.5} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-[28px] z-10 bg-white border border-[#DEDEDE] rounded-[4px] shadow-sm w-[80px]">
            <button
              type="button"
              className="w-full px-[12px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-[#212121] hover:bg-[#f6f6f6]"
              onClick={() => {
                setMenuOpen(false);
                console.log('댓글 수정 클릭', comment.commentId);
              }}
            >
              수정
            </button>
            <button
              type="button"
              className="w-full px-[12px] py-[10px] text-left text-[14px] tracking-[-0.28px] text-[#212121] hover:bg-[#f6f6f6]"
              onClick={() => {
                setMenuOpen(false);
                console.log('댓글 삭제 클릭', comment.commentId);
              }}
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
