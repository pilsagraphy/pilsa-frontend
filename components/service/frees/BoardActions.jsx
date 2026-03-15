'use client';

import React, { useEffect, useState } from 'react';

export default function BoardActions({ likeCount, liked: initialLiked = false }) {
  const [count, setCount] = useState(typeof likeCount === 'number' ? likeCount : 0);
  const [liked, setLiked] = useState(Boolean(initialLiked));

  useEffect(() => {
    setCount(typeof likeCount === 'number' ? likeCount : 0);
    setLiked(Boolean(initialLiked));
  }, [likeCount, initialLiked]);

  const handleLike = () => {
    setCount((prev) => (liked ? prev - 1 : prev + 1));
    setLiked((prev) => !prev);
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* 좋아요 버튼 */}
      <button
        type="button"
        onClick={handleLike}
        className="bg-white h-[52px] w-[135px] border border-[#b9b9b9] rounded-[4px] flex items-center justify-center gap-[6px] text-[16px] tracking-[-0.32px] transition-colors hover:bg-[#f5f5f5]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 10V20H4V10H7ZM9 20H15.5C16.3 20 17 19.4 17.2 18.6L18.9 11.6C19.1 10.8 18.5 10 17.7 10H13V5.5C13 4.7 12.3 4 11.5 4L9 10V20Z"
            fill={liked ? '#212121' : '#212121'}
            stroke="#1E1E1E"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[#212121] text-center">좋아요 {count}</span>
      </button>

      {/* 수정 / 삭제 */}
      <div className="flex gap-[20px]">
        <button
          type="button"
          className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px] text-[16px] tracking-[-0.32px]"
          onClick={() => console.log('수정 클릭')}
        >
          수정
        </button>
        <button
          type="button"
          className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px] text-[16px] tracking-[-0.32px]"
          onClick={() => console.log('삭제 클릭')}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
