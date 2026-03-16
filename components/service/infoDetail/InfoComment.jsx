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
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content ?? '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSecret, setIsSecret] = useState(Boolean(comment.private));
  const menuRef = useRef(null);

  const displayContent = comment.private ? '비밀 댓글입니다.' : comment.content;
  const displayAuthor = comment.authorName ?? '익명';

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditSubmit = () => {
    console.log('댓글 수정 완료:', {
      commentId: comment.commentId,
      content: editText,
      anonymous: isAnonymous,
      secret: isSecret,
    });
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditText(comment.content ?? '');
    setIsAnonymous(false);
    setIsSecret(Boolean(comment.private));
    setIsEditing(false);
  };

  return (
    <div className="flex items-start justify-between px-[40px] py-[16px] w-full">
      <div className="flex flex-col gap-[7px] flex-1 pr-[12px]">
        {/* 작성자 */}
        <div className="flex items-start gap-[16px]">
          {isReply && <ReplyIcon />}
          <span className="text-[16px] tracking-[-0.32px] text-[#454545] leading-[1.6]">
            {displayAuthor}
          </span>
        </div>

        {/* 내용 + 날짜 */}
        <div className={['flex flex-col gap-[7px]', isReply ? 'pl-[30px]' : ''].join(' ')}>
          {isEditing ? (
            <div className="flex flex-col gap-[8px]">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-[40px] border border-[#b9b9b9] rounded-[4px] px-[12px] text-[16px] tracking-[-0.32px] text-[#212121] outline-none focus:border-[#919191]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSubmit();
                  if (e.key === 'Escape') handleEditCancel();
                }}
                autoFocus
              />
              {/* ✅ 완료/취소 + 익명/비밀 댓글 체크박스 한 줄에 */}
              <div className="flex items-center gap-[12px] flex-wrap">
                <button
                  type="button"
                  onClick={handleEditSubmit}
                  className="h-[32px] px-[12px] bg-[#212121] text-white rounded-[4px] text-[14px] tracking-[-0.28px]"
                >
                  완료
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="h-[32px] px-[12px] border border-[#b9b9b9] rounded-[4px] text-[14px] tracking-[-0.28px] text-[#212121]"
                >
                  취소
                </button>

                {/* 익명 체크박스 */}
                <div className="flex items-center gap-[6px]">
                  <input
                    type="checkbox"
                    id={`info-edit-anonymous-${comment.commentId}`}
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-[18px] h-[18px] border border-[#919191] rounded-[2px] cursor-pointer accent-[#212121]"
                  />
                  <label
                    htmlFor={`info-edit-anonymous-${comment.commentId}`}
                    className="text-[14px] tracking-[-0.28px] text-[#919191] cursor-pointer"
                  >
                    익명
                  </label>
                </div>

                {/* 비밀 댓글 체크박스 */}
                <div className="flex items-center gap-[6px]">
                  <input
                    type="checkbox"
                    id={`info-edit-secret-${comment.commentId}`}
                    checked={isSecret}
                    onChange={(e) => setIsSecret(e.target.checked)}
                    className="w-[18px] h-[18px] border border-[#919191] rounded-[2px] cursor-pointer accent-[#212121]"
                  />
                  <label
                    htmlFor={`info-edit-secret-${comment.commentId}`}
                    className="text-[14px] tracking-[-0.28px] text-[#919191] cursor-pointer"
                  >
                    비밀 댓글
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[16px] tracking-[-0.32px] text-[#454545] leading-[1.6]">
              {displayContent}
            </p>
          )}
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
                setIsEditing(true);
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
