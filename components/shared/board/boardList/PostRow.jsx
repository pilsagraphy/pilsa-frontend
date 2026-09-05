'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import CategoryBadge from './CategoryBadge';
import { cn } from '@/lib/utils';
import { Paperclip } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

// 목록 응답 항목: postId, title, authorName, likeCount, viewCount, commentCount,
//                categoryName, isPinned, isAnonymous, hasAttachment, created
export default function PostRow({ post, boardId, board, listQuery = '' }) {
  const router = useRouter();

  const allowComment = Boolean(board?.allowComment);
  const categoryMode = Boolean(board?.categoryMode);

  // 상세 페이지로 이동.
  // 목록 상태(페이지·정렬·검색어·카테고리)를 그대로 달고 가서
  // 글에서 목록으로 돌아올 때 보던 화면이 복원된다. 정렬은 이전/다음 글 순서에도 쓰인다.
  const handleRowClick = () => {
    const href = ROUTES.BOARD_POST(boardId, post.postId);
    router.push(listQuery ? `${href}?${listQuery}` : href);
  };

  // 날짜 포맷 : YYYY-MM-DD -> YYYY.MM.DD
  const formattedDate = post.created?.slice(0, 10).replace(/-/g, '.');

  // 제목 옆 배지. 상단 고정은 '중요' 카테고리로 결정되므로 보통 categoryName 이 '중요'로 온다.
  // 카테고리를 쓰지 않는 게시판(공지사항 등)에서 categoryName 이 비어 오는 경우를 대비해
  // isPinned 로 한 번 더 받쳐준다 (상세 화면과 같은 방식).
  const badgeLabel = post.categoryName || (post.isPinned ? '중요' : '');

  return (
    <TableRow
      onClick={handleRowClick}
      className="h-12 cursor-pointer border-b border-[#B9B9B9] text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545] hover:bg-muted/50 md:h-14 md:text-[16px]"
    >
      {/* 1. 게시글 번호 — 중요글도 번호를 그대로 보여준다 ('중요' 표시는 제목 옆 배지가 담당).
             카테고리 게시판은 모바일에서 번호 숨김 */}
      <TableCell className={cn('text-center', categoryMode && 'hidden md:table-cell')}>
        {post.postId}
      </TableCell>

      {/* 2. 제목 (카테고리/중요 배지 + 제목 + 첨부 아이콘) */}
      <TableCell className="text-left min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {badgeLabel && <CategoryBadge>{badgeLabel}</CategoryBadge>}
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
