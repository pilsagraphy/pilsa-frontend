'use client';

import { Eye, Heart, Paperclip } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

// 모바일 전용 목록 아이템 (피그마 기준)
// - 윗줄: 칩(공지=검정 채움 / 카테고리=흰 바탕 테두리) + 제목(말줄임)
// - 아랫줄: 조회수 · 좋아요 · 작성일
export default function PostRowMobile({ post, boardId, listQuery = '' }) {
  const router = useRouter();

  const handleClick = () => {
    const href = ROUTES.BOARD_POST(boardId, post.postId);
    router.push(listQuery ? `${href}?${listQuery}` : href);
  };

  const formattedDate = post.created?.slice(0, 10).replace(/-/g, '.');

  // 배지: 카테고리명 우선, 없으면 중요글만 '중요'. '중요'/'공지'는 채움, 일반 카테고리는 테두리.
  const badgeLabel = post.categoryName || (post.isPinned ? '중요' : '');
  const filled = Boolean(post.isPinned) || badgeLabel === '중요' || badgeLabel === '공지';

  return (
    <div
      onClick={handleClick}
      className="flex cursor-pointer flex-col gap-[6px] border-t border-[#DEDEDE] pb-2 pt-3 transition-colors active:bg-[#F6F6F6]"
    >
      {/* 윗줄: 칩 + 제목 */}
      <div className="flex items-center gap-[10px] px-5">
        {badgeLabel && (
          <span
            className={cn(
              'inline-flex h-[27px] shrink-0 items-center rounded-full px-3 text-[14px] leading-none tracking-[-0.02em]',
              filled ? 'bg-[#212121] text-white' : 'border border-[#919191] text-[#212121]'
            )}
          >
            {badgeLabel}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[16px] font-medium leading-[1.6] tracking-[-0.04em] text-[#454545]">
          {post.title}
        </span>
        {post.hasAttachment && <Paperclip size={16} className="shrink-0 text-[#919191]" />}
      </div>

      {/* 아랫줄: 조회수 · 좋아요 · 작성일 */}
      <div className="flex items-center gap-3 px-6 text-[13px] leading-[1.6] text-[#919191]">
        <span className="inline-flex items-center gap-1">
          <Eye size={18} strokeWidth={1.5} />
          {post.viewCount?.toLocaleString() ?? 0}
        </span>
        <span className="inline-flex items-center gap-1">
          <Heart size={18} strokeWidth={1.5} />
          {post.likeCount?.toLocaleString() ?? 0}
        </span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}
