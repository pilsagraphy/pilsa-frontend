'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toggleFreePostLike, deleteFreePost } from '@/apis/free';
import { getErrorMessage } from '@/apis/auth';
import useAuthStore from '@/stores/useAuthStore';

export default function FreeActions({
  postId,
  authorId,
  likecount,
  liked: initialLiked = false,
  afterLikeOnMobile = null,
}) {
  const initialCount = typeof likecount === 'number' ? likecount : 0;

  const [likeCount, setLikeCount] = useState(initialCount);
  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [likeLoading, setLikeLoading] = useState(false);

  const router = useRouter();

  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setLikeCount(initialCount);
    setLiked(Boolean(initialLiked));
  }, [initialCount, initialLiked]);

  const currentUserId = useMemo(() => {
    return user?.userId ?? user?.id ?? user?.user_id ?? null;
  }, [user]);

  const canEdit = useMemo(() => {
    const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
    const isAuthor =
      currentUserId !== null && authorId !== null && Number(currentUserId) === Number(authorId);

    return isAdmin || isAuthor;
  }, [role, currentUserId, authorId]);

  const handleLike = async () => {
    if (!postId || likeLoading) return;

    const prevLiked = liked;
    const prevCount = likeCount;

    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setLikeLoading(true);

    try {
      await toggleFreePostLike(postId);
    } catch (error) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      alert(getErrorMessage(error, '좋아요 처리에 실패했습니다.'));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleEdit = () => {
    if (!canEdit) {
      alert('수정 권한이 없습니다.');
      return;
    }

    router.push(`/students/free/${postId}/edit`);
  };

  const handleDelete = async () => {
    if (!postId) return;

    const ok = window.confirm('정말 삭제하시겠습니까?');
    if (!ok) return;

    try {
      await deleteFreePost(postId);
      alert('삭제되었습니다.');
      router.push('/students/free');
    } catch (error) {
      alert(getErrorMessage(error, '게시글 삭제에 실패했습니다.'));
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-0">
      <div className="flex w-full flex-col gap-[10px] md:w-auto">
        {/* 좋아요 버튼 */}
        <button
          type="button"
          onClick={handleLike}
          disabled={likeLoading}
          className="flex h-12 w-full items-center justify-center gap-[6px] rounded-[4px] border border-[#b9b9b9] text-[15px] tracking-[-0.32px] transition-colors hover:bg-[#f5f5f5] disabled:opacity-60 md:h-[52px] md:w-[135px] md:text-[16px]"
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

        {afterLikeOnMobile != null && <div className="w-full md:hidden">{afterLikeOnMobile}</div>}
      </div>

      {/* 수정 / 삭제 */}
      <div className="flex w-full gap-2 md:w-auto md:gap-5">
        <button
          type="button"
          className="h-12 flex-1 rounded-[4px] bg-[#212121] text-white md:h-[52px] md:w-[135px] md:flex-none"
          onClick={handleEdit}
        >
          수정
        </button>
        <button
          type="button"
          className="h-12 flex-1 rounded-[4px] bg-[#212121] text-white md:h-[52px] md:w-[135px] md:flex-none"
          onClick={handleDelete}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
