'use client';

import React, { useEffect, useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteInfoPost, toggleInfoPostLike } from '@/apis/info';
import { getErrorMessage } from '@/apis/auth';
import useAuthStore from '@/stores/useAuthStore';

export default function InfoActions({
  postId,
  authorId,
  likeCount: initialLikeCount = 0,
  liked: initialLiked = false,
  onDeleted,
}) {
  const [likeCount, setLikeCount] = useState(
    typeof initialLikeCount === 'number' ? initialLikeCount : 0
  );
  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [likeLoading, setLikeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  const currentUserId = Number(user?.userId ?? user?.id ?? user?.user_id);
  const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
  const canEdit = isAdmin || (Number.isFinite(currentUserId) && currentUserId === Number(authorId));
  const canDelete = Number.isFinite(currentUserId) && currentUserId === Number(authorId);

  useEffect(() => {
    setLikeCount(typeof initialLikeCount === 'number' ? initialLikeCount : 0);
    setLiked(Boolean(initialLiked));
  }, [initialLikeCount, initialLiked]);

  const handleLike = async () => {
    if (likeLoading) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((prev) => prev + (nextLiked ? 1 : -1));

    try {
      setLikeLoading(true);
      await toggleInfoPostLike(postId);
    } catch (error) {
      setLiked((prev) => !prev);
      setLikeCount((prev) => prev + (nextLiked ? -1 : 1));
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

    router.push(`/students/info/${postId}/edit`);
  };

  const handleDelete = async () => {
    if (!canDelete) {
      alert('본인 글만 삭제할 수 있습니다.');
      return;
    }

    const confirmed = window.confirm('게시글을 삭제하시겠습니까?');
    if (!confirmed || deleteLoading) return;

    try {
      setDeleteLoading(true);
      await deleteInfoPost(postId);
      alert('삭제가 완료되었습니다.');
      onDeleted?.();
    } catch (error) {
      alert(getErrorMessage(error, '게시글 삭제에 실패했습니다.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-between">
      {/* 좋아요 버튼 */}
      <button
        type="button"
        onClick={handleLike}
        disabled={likeLoading}
        className="flex h-[52px] w-[135px] items-center justify-center gap-[6px] rounded-[4px] border border-[#b9b9b9] text-[16px] tracking-[-0.32px] transition-colors hover:bg-[#f5f5f5] disabled:opacity-60"
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
          className="h-[52px] w-[135px] rounded-[4px] bg-[#212121] text-white"
          onClick={handleEdit}
        >
          수정
        </button>
        <button
          type="button"
          disabled={deleteLoading}
          className="h-[52px] w-[135px] rounded-[4px] bg-[#212121] text-white disabled:opacity-60"
          onClick={handleDelete}
        >
          {deleteLoading ? '삭제 중...' : '삭제'}
        </button>
      </div>
    </div>
  );
}
