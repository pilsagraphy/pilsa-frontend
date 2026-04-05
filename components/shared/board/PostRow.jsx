'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import CategoryBadge from './CategoryBadge';
import { cn } from '@/lib/utils';
import { Paperclip } from 'lucide-react';
import { useRouter } from 'next/navigation';

// [notices] postId, title, authorName, likeCount, viewCount, hasAttachment, created, pinned
// [free, info] postId, title, authorName, likeCount, viewCount, commentCount, categoryName, hasAttachment, created
export default function PostRow({ post, boardType, sortOrder = 'latest' }) {
  const router = useRouter();

  // 상세 페이지 이동 핸들러 (students/notices|info|free/[id]/page.js)
  const handleRowClick = () => {
    const query = boardType === 'notices' ? `?sort=${encodeURIComponent(sortOrder)}` : '';
    router.push(`/students/${boardType}/${post.postId}${query}`);
  };

  // 날짜 포맷 : YYYY-MM-DD -> YYYY.MM.DD
  const formattedDate = post.created?.slice(0, 10).replace(/-/g, '.');
  const isPinned = Boolean(post.pinned ?? post.isPinned);
  const isFreeOrInfo = boardType === 'free' || boardType === 'info';

  return (
    <TableRow
      onClick={handleRowClick}
      className="h-12 cursor-pointer border-b border-[#B9B9B9] text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545] hover:bg-muted/50 md:h-14 md:text-[16px]"
    >
      {/* 1. 게시글 번호 (공지사항 중요글은 배지로 표시) */}
      <TableCell
        className={cn('text-center', isFreeOrInfo && 'hidden md:table-cell')}
      >
        {boardType === 'notices' && isPinned ? (
          <CategoryBadge variant="pinned">중요</CategoryBadge>
        ) : (
          post.postId
        )}
      </TableCell>

      {/* 2. 제목 (카테고리 + 제목 + 첨부파일 아이콘) */}
      <TableCell className="text-left min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {boardType !== 'notices' && post.categoryName != null && (
            <CategoryBadge>{post.categoryName}</CategoryBadge>
          )}
          <span className="truncate">{post.title}</span>
          {post.hasAttachment && (
            <span className="flex-shrink-0 text-[#919191]">
              <Paperclip size={16} />
            </span>
          )}
        </div>
      </TableCell>

      {/* 3. 댓글 (공지사항은 미표시)*/}
      {boardType !== 'notices' && (
        <TableCell className="hidden text-center md:table-cell">
          {post.commentCount?.toLocaleString() || 0}
        </TableCell>
      )}

      {/* 4. 좋아요, 조회수, 등록일 (모바일·좁은 화면에서는 숨김) */}
      <TableCell className="hidden text-center md:table-cell">
        {post.likeCount?.toLocaleString() || 0}
      </TableCell>
      <TableCell className="hidden text-center md:table-cell">
        {post.viewCount?.toLocaleString() || 0}
      </TableCell>
      <TableCell className="text-center">{formattedDate}</TableCell>
    </TableRow>
  );
}
