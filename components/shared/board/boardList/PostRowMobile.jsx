'use client';

import { Eye, Heart, MessageCircle, Paperclip } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import CategoryBadge from './CategoryBadge';

// 모바일 전용 목록 아이템 (피그마 기준)
// - 윗줄: 칩(공지=검정 채움 / 카테고리=흰 바탕 테두리) + 제목(말줄임)
// - 아랫줄: 조회수 · 좋아요 · 작성일
export default function PostRowMobile({ post, boardId, listQuery = '', allowComment = true }) {
  const router = useRouter();

  const handleClick = () => {
    const href = ROUTES.BOARD_POST(boardId, post.postId);
    router.push(listQuery ? `${href}?${listQuery}` : href);
  };

  const formattedDate = post.created?.slice(0, 10).replace(/-/g, '.');

  // 배지: 카테고리명 우선, 없으면 중요글만 '중요'. 색을 줄지는 CategoryBadge 가 라벨로 판단한다
  const badgeLabel = post.categoryName || (post.isPinned ? '중요' : '');

  return (
    <div
      onClick={handleClick}
      className="flex cursor-pointer flex-col gap-[6px] border-t border-[#DEDEDE] pb-2 pt-3 transition-colors active:bg-[#F6F6F6]"
    >
      {/* 윗줄: 칩 + 제목 */}
      <div className="flex items-center gap-[10px] px-5">
        {badgeLabel && <CategoryBadge variant="mobile">{badgeLabel}</CategoryBadge>}
        <span className="min-w-0 flex-1 truncate text-[16px] font-medium leading-[1.6] tracking-[-0.04em] text-[#454545]">
          {post.title}
        </span>
        {post.hasAttachment && <Paperclip size={16} className="shrink-0 text-[#919191]" />}
        {/* 글쓴이는 줄의 오른쪽 끝에 (제목이 짧아도 끝에 붙는다) */}
        {post.authorName && (
          <span className="ml-auto max-w-[96px] shrink-0 truncate text-[13px] leading-[1.6] text-[#919191]">
            {post.authorName}
          </span>
        )}
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
        {/* 댓글을 쓰는 게시판만 — 공지사항엔 댓글이 없다 */}
        {allowComment && (
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={18} strokeWidth={1.5} />
            {post.commentCount?.toLocaleString() ?? 0}
          </span>
        )}
        {/* 날짜는 글쓴이 아래 오른쪽 끝 — 마이페이지 카드와 같은 자리 */}
        <span className="ml-auto shrink-0">{formattedDate}</span>
      </div>
    </div>
  );
}
