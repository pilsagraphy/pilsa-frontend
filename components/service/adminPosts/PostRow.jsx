'use client';

import Link from 'next/link';

import { TableCell, TableRow } from '@/components/ui/table';
import RowActionButton from '@/components/shared/admin/RowActionButton';
import RowCheckbox from '@/components/shared/admin/RowCheckbox';
import { POST_STATUSES, getPostDetailHref } from '@/constants/adminPosts';

// post: postId, boardId, boardName, title, author, commentCount, likeCount,
//       viewCount, createdAt, status
export default function PostRow({
  post,
  selected = false,
  onSelectChange,
  onBlind,
  onDelete,
  onMoveToReport,
}) {
  const isBlinded = post.status === POST_STATUSES.BLINDED;
  const detailHref = getPostDetailHref(post.boardId, post.postId);

  return (
    <TableRow className="h-[46px] border-b border-[#b9b9b9] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#212121]">
      {/* 1. 선택 체크박스 */}
      <TableCell className="text-center">
        <RowCheckbox
          checked={selected}
          onCheckedChange={(checked) => onSelectChange?.(post.postId, checked)}
          label={`${post.title} 선택`}
        />
      </TableCell>

      {/* 2. 게시판 명 */}
      <TableCell className="whitespace-nowrap text-center">{post.boardName}</TableCell>

      {/* 3. 제목 - 누르면 해당 게시글 상세로 이동한다.
             경로를 모르는 게시판이면 링크 없이 텍스트만 보여준다.
             제목이 길면 행 높이가 늘어나지 않도록 한 줄로 줄여 말줄임 처리한다. */}
      <TableCell className="text-center">
        {detailHref ? (
          <Link
            href={detailHref}
            title={post.title}
            className="block truncate underline decoration-solid underline-offset-2"
          >
            {post.title}
          </Link>
        ) : (
          <span
            title={post.title}
            className="block truncate underline decoration-solid underline-offset-2"
          >
            {post.title}
          </span>
        )}
      </TableCell>

      {/* 4. 글쓴이 · 활동 수치 */}
      <TableCell className="whitespace-nowrap text-center">{post.author}</TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {post.commentCount?.toLocaleString() ?? 0}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {post.likeCount?.toLocaleString() ?? 0}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {post.viewCount?.toLocaleString() ?? 0}
      </TableCell>

      {/* 5. 작성일 · 상태 */}
      <TableCell className="whitespace-nowrap text-center">{post.createdAt}</TableCell>
      <TableCell className="whitespace-nowrap text-center">{post.status}</TableCell>

      {/* 6. 관리 - 공개 글은 블라인드 · 삭제,
             이미 블라인드된 글은 신고 관리로 넘긴다. */}
      <TableCell className="text-center">
        {isBlinded ? (
          <RowActionButton className="min-w-[99px]" onClick={() => onMoveToReport?.(post)}>
            신고 관리로 이동
          </RowActionButton>
        ) : (
          <div className="flex items-center justify-center gap-[8px]">
            <RowActionButton className="min-w-[60px]" onClick={() => onBlind?.(post)}>
              블라인드
            </RowActionButton>
            <RowActionButton filled className="min-w-[44px]" onClick={() => onDelete?.(post)}>
              삭제
            </RowActionButton>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
