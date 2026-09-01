'use client';

import React, { useEffect, useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toggleBoardPostLike, deleteBoardPost } from '@/apis/board';
import { getErrorMessage } from '@/apis/auth';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES } from '@/constants/routes';

// 좋아요 + (권한이 있을 때만) 수정/삭제 버튼
//  - 수정: 작성자 또는 관리자
//  - 삭제: 작성자 본인만 (관리자는 관리자 화면에서 조치)
export default function BoardActions({
  boardId,
  postId,
  authorId,
  likeCount: initialLikeCount = 0,
  liked: initialLiked = false,
  onDeleted,
  afterLikeOnMobile = null,
}) {
  const router = useRouter();

  const [likeCount, setLikeCount] = useState(
    typeof initialLikeCount === 'number' ? initialLikeCount : 0
  );
  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [likeLoading, setLikeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const user = useAuthStore((s) => s.user);
  const adminLevel = useAuthStore((s) => s.adminLevel);

  const currentUserId = Number(user?.userId ?? user?.id ?? user?.user_id);
  const isAdmin = adminLevel >= 1;
  const isAuthor = Number.isFinite(currentUserId) && currentUserId === Number(authorId);

  const canEdit = isAdmin || isAuthor;
  const canDelete = isAuthor;

  useEffect(() => {
    setLikeCount(typeof initialLikeCount === 'number' ? initialLikeCount : 0);
    setLiked(Boolean(initialLiked));
  }, [initialLikeCount, initialLiked]);

  const handleLike = async () => {
    if (!postId || likeLoading) return;

    const prevLiked = liked;
    const prevCount = likeCount;

    // 낙관적 업데이트 후 실패 시 롤백 (응답은 메시지만 주므로 카운트는 프론트가 계산)
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setLikeLoading(true);

    try {
      await toggleBoardPostLike(boardId, postId);
    } catch (error) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      alert(getErrorMessage(error, '좋아요 처리에 실패했습니다.'));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(ROUTES.BOARD_POST_EDIT(boardId, postId));
  };

  const handleDelete = async () => {
    if (!postId || deleteLoading) return;

    const confirmed = window.confirm('게시글을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      await deleteBoardPost(boardId, postId);
      alert('삭제가 완료되었습니다.');
      onDeleted?.();
    } catch (error) {
      alert(getErrorMessage(error, '게시글 삭제에 실패했습니다.'));
    } finally {
      setDeleteLoading(false);
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
          aria-pressed={liked}
          className={`flex h-12 w-full items-center justify-center gap-[6px] rounded-[4px] border text-[15px] tracking-[-0.32px] transition-colors disabled:opacity-60 md:h-[52px] md:w-[135px] md:text-[16px] ${
            liked
              ? 'border-[#212121] bg-[#212121] text-white hover:bg-black'
              : 'border-[#b9b9b9] bg-white text-[#212121] hover:bg-[#f5f5f5]'
          }`}
        >
          {/* 색은 버튼의 text 색을 따라간다 (lucide 아이콘 기본 stroke 가 currentColor) */}
          <ThumbsUp width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
          <span>좋아요 {likeCount}</span>
        </button>

        {afterLikeOnMobile != null && <div className="w-full md:hidden">{afterLikeOnMobile}</div>}
      </div>

      {/* 수정 / 삭제 (권한 있을 때만) */}
      {(canEdit || canDelete) && (
        <div className="flex w-full gap-2 md:w-auto md:gap-5">
          {canEdit && (
            <button
              type="button"
              className="h-12 flex-1 rounded-[4px] bg-[#212121] text-white md:h-[52px] md:w-[135px] md:flex-none"
              onClick={handleEdit}
            >
              수정
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              disabled={deleteLoading}
              className="h-12 flex-1 rounded-[4px] bg-[#212121] text-white disabled:opacity-60 md:h-[52px] md:w-[135px] md:flex-none"
              onClick={handleDelete}
            >
              {deleteLoading ? '삭제 중...' : '삭제'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
