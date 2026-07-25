'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { toggleNoticeLike } from '@/apis/notice';
import { getErrorMessage } from '@/apis/auth';
import { ThumbsUp } from 'lucide-react';

export default function NoticeActions({ postId, likecount, liked: initialLiked = false }) {
  const initialCount = typeof likecount === 'number' ? likecount : 0;

  const [likeCount, setLikeCount] = useState(initialCount);
  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLikeCount(initialCount);
    setLiked(Boolean(initialLiked));
  }, [initialCount, initialLiked]);

  const handleLike = async () => {
    if (!postId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await toggleNoticeLike(postId);

      setLikeCount((prev) => (liked ? Math.max(0, prev - 1) : prev + 1));
      setLiked((prev) => !prev);
    } catch (error) {
      toast.error(getErrorMessage(error, '좋아요 처리에 실패했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full items-stretch justify-between md:items-center">
      {/* 좋아요 버튼 */}
      <button
        type="button"
        onClick={handleLike}
        disabled={isSubmitting}
        className="
          flex
          h-12
          w-full
          items-center
          justify-center
          gap-[6px]
          rounded-[4px]
          border
          border-[#b9b9b9]
          text-[15px]
          tracking-[-0.32px]
          transition-colors
          hover:bg-[#f5f5f5]
          disabled:cursor-not-allowed
          disabled:opacity-60
          md:h-[52px]
          md:w-[135px]
          md:text-[16px]
        "
      >
        {/* 아이콘 */}
        <ThumbsUp size={18} strokeWidth={1.5} color={liked ? '#212121' : '#1E1E1E'} />

        {/* ✅ mock likecount 기반 */}
        <span className="text-[#212121]">좋아요 {likeCount}</span>
      </button>

      {/* 수정 / 삭제 - 관리자만 가능 -> 따라서 후순위 */}
      {/* <div className="flex gap-[20px]">
        <button
          type="button"
          className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px]"
          onClick={() => router.push('/students/notices/write')}
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
      </div> */}
    </div>
  );
}
