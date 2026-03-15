'use client';

import React, { useEffect, useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FreeActions({ likecount, liked: initialLiked = false }) {
  const initialCount = typeof likecount === 'number' ? likecount : 0;

  const [likeCount, setLikeCount] = useState(initialCount);
  const [liked, setLiked] = useState(Boolean(initialLiked));

  const router = useRouter();

  useEffect(() => {
    setLikeCount(initialCount);
    setLiked(Boolean(initialLiked));
  }, [initialCount, initialLiked]);

  const handleLike = () => {
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
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
        <ThumbsUp
          width={18}
          height={18}
          stroke={liked ? '#212121' : '#1E1E1E'}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <span className="text-[#212121]">좋아요 {likeCount}</span>
      </button>

      {/* 수정 / 삭제 */}
      <div className="flex gap-[20px]">
        <button
          type="button"
          className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px]"
          onClick={() => router.push('/students/free/write')}
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
