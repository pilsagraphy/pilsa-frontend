'use client';

import React, { useState } from 'react';

export default function NoticeActions({ likes = 0 }) {
  // ✅ 마크업 단계에서 상태 관리
  const [likeCount, setLikeCount] = useState(likes);
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    // API 없이 프론트에서만 토글
    if (liked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setLiked((prev) => !prev);
  };

  return (
    <div className="flex justify-between items-center w-full">
      {/* 좋아요 버튼 */}
      <button
        type="button"
        onClick={handleLike}
        className="
          h-[52px]
          w-[135px]
          border
          border-[#b9b9b9]
          rounded-[4px]
          flex
          items-center
          justify-center
          gap-[6px]
          text-[16px]
          tracking-[-0.32px]
          transition-colors
          hover:bg-[#f5f5f5]
        "
      >
        {/* 아이콘 */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 10V20H4V10H7ZM9 20H15.5C16.3 20 17 19.4 17.2 18.6L18.9 11.6C19.1 10.8 18.5 10 17.7 10H13V5.5C13 4.7 12.3 4 11.5 4L9 10V20Z"
            stroke={liked ? '#212121' : '#1E1E1E'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* 숫자 */}
        <span className="text-[#212121]">좋아요 {likeCount}</span>
      </button>

      {/* 수정 / 삭제 (권한은 나중에) */}
      <div className="flex gap-[20px]">
        <button
          type="button"
          className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px]"
          onClick={() => console.log('수정 클릭')}
        >
          수정
        </button>
        <button
          type="button"
          className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px]"
          onClick={() => console.log('삭제 클릭')}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
