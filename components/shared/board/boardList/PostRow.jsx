'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import CategoryBadge from './CategoryBadge';
import { cn } from '@/lib/utils';
import { Paperclip } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

// 목록 응답 항목: postId, title, authorName, likeCount, viewCount, commentCount,
//                categoryName, isPinned, isAnonymous, hasAttachment, created
export default function PostRow({ post, boardId, board, sortOrder = 'created' }) {
  const router = useRouter();

  const allowComment = Boolean(board?.allowComment);
  const categoryMode = Boolean(board?.categoryMode);

  // 상세 페이지로 이동 (정렬 상태를 이어받아 이전/다음 글 순서 유지)
  const handleRowClick = () => {
    router.push(`${ROUTES.BOARD_POST(boardId, post.postId)}?sort=${encodeURIComponent(sortOrder)}`);
  };

  // 날짜 포맷 : YYYY-MM-DD -> YYYY.MM.DD
  const formattedDate = post.created?.slice(0, 10).replace(/-/g, '.');
  const isPinned = Boolean(post.isPinned);

  return (
    <TableRow
      onClick={handleRowClick}
      className="h-12 cursor-pointer border-b border-[#B9B9B9] text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545] hover:bg-muted/50 md:h-14 md:text-[16px]"
    >
      {/* 1. 게시글 번호 (중요글은 배지로 표시). 카테고리 게시판은 모바일에서 번호 숨김 */}
      <TableCell className={cn('text-center', categoryMode && 'hidden md:table-cell')}>
        {isPinned ? <CategoryBadge variant="pinned">중요</CategoryBadge> : post.postId}
      </TableCell>

      {/* 2. 제목 (카테고리 배지 + 제목 + 첨부 아이콘) */}
      <TableCell className="text-left min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {post.categoryName != null && <CategoryBadge>{post.categoryName}</CategoryBadge>}
          <span className="truncate">{post.title}</span>
          {post.hasAttachment && (
            <span className="flex-shrink-0 text-[#919191]">
              <Paperclip size={16} />
            </span>
          )}
        </div>
      </TableCell>

      {/* 3. 댓글 (댓글을 쓰는 게시판만) */}
      {allowComment && (
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
