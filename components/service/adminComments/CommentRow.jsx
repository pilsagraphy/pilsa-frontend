'use client';

import Link from 'next/link';

import { TableCell, TableRow } from '@/components/ui/table';
import RowActionButton from '@/components/shared/admin/RowActionButton';
import RowCheckbox from '@/components/shared/admin/RowCheckbox';
import { COMMENT_STATUSES, getPostDetailHref } from '@/constants/adminComments';

// comment: commentId, boardId, boardName, author, content, createdAt, status, postId, postTitle
export default function CommentRow({
  comment,
  selected = false,
  onSelectChange,
  onBlind,
  onDelete,
  onMoveToReport,
}) {
  const isBlinded = comment.status === COMMENT_STATUSES.BLINDED;
  const postHref = getPostDetailHref(comment.boardId, comment.postId);

  return (
    <TableRow className="h-[46px] border-b border-[#b9b9b9] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#212121]">
      {/* 1. 선택 체크박스 */}
      <TableCell className="text-center">
        <RowCheckbox
          checked={selected}
          onCheckedChange={(checked) => onSelectChange?.(comment.commentId, checked)}
          label={`${comment.author}님의 댓글 선택`}
        />
      </TableCell>

      {/* 2. 게시판 명 · 글쓴이 */}
      <TableCell className="whitespace-nowrap text-center">{comment.boardName}</TableCell>
      <TableCell className="whitespace-nowrap text-center">{comment.author}</TableCell>

      {/* 3. 댓글 내용 - 길어도 행 높이(46px)가 늘어나지 않도록 한 줄로 줄여 말줄임 처리한다. */}
      <TableCell className="text-center">
        <span title={comment.content} className="block truncate">
          {comment.content}
        </span>
      </TableCell>

      {/* 4. 댓글 작성일 · 상태 */}
      <TableCell className="whitespace-nowrap text-center">{comment.createdAt}</TableCell>
      <TableCell className="whitespace-nowrap text-center">{comment.status}</TableCell>

      {/* 5. 원글 - 댓글이 달린 게시글 상세로 이동한다.
             열이 좁아 제목 대신 '바로가기'로 두고 제목은 title 속성으로만 보여준다.
             링크 텍스트가 전부 '바로가기'라 보조기기에서는 구분되지 않으므로
             aria-label로 원글 제목을 알려준다. (텍스트가 있으면 title은 접근성 이름이 되지 않는다)
             TODO: 원글 제목을 노출해야 하면 디자인팀과 열 너비를 다시 맞출 것 */}
      <TableCell className="whitespace-nowrap text-center">
        {postHref ? (
          <Link
            href={postHref}
            title={comment.postTitle}
            aria-label={`원글 보기: ${comment.postTitle}`}
            className="underline decoration-solid underline-offset-2"
          >
            바로가기
          </Link>
        ) : (
          <span className="text-[#919191]">-</span>
        )}
      </TableCell>

      {/* 6. 관리 - 공개 댓글은 블라인드 · 삭제,
             이미 블라인드된 댓글은 신고 관리로 넘긴다. */}
      <TableCell className="text-center">
        {isBlinded ? (
          <RowActionButton className="min-w-[99px]" onClick={() => onMoveToReport?.(comment)}>
            신고 관리로 이동
          </RowActionButton>
        ) : (
          <div className="flex items-center justify-center gap-[8px]">
            <RowActionButton className="min-w-[60px]" onClick={() => onBlind?.(comment)}>
              블라인드
            </RowActionButton>
            <RowActionButton filled className="min-w-[37px]" onClick={() => onDelete?.(comment)}>
              삭제
            </RowActionButton>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
