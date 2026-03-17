'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toggleFreePostLike, deleteFreePost } from '@/apis/free';
import { getErrorMessage } from '@/apis/auth';
import useAuthStore from '@/stores/useAuthStore';

export default function FreeActions({ postId, authorId, likecount, liked: initialLiked = false }) {
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
    <div className="flex justify-between items-center w-full">
      {/* 좋아요 버튼 */}
      <button
        type="button"
        onClick={handleLike}
        disabled={likeLoading}
        className="h-[52px] w-[135px] border border-[#b9b9b9] rounded-[4px] flex items-center justify-center gap-[6px] text-[16px] tracking-[-0.32px] transition-colors hover:bg-[#f5f5f5] disabled:opacity-60"
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
          onClick={handleEdit}
        >
          수정
        </button>
        <button
          type="button"
          className="h-[52px] w-[135px] bg-[#212121] text-white rounded-[4px]"
          onClick={handleDelete}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
