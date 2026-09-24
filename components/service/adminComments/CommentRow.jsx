'use client';

import Link from 'next/link';

import { TableCell, TableRow } from '@/components/ui/table';
import RowActionButton from '@/components/shared/admin/RowActionButton';
import RowCheckbox from '@/components/shared/admin/RowCheckbox';
import { formatShortDotDate } from '@/lib/boardDetail';
import {
  COMMENT_STATES,
  getCommentOriginHref,
  getCommentStateLabel,
} from '@/constants/adminComments';

// comment: 서버 응답 그대로 — commentId, postId, boardId, boardName,
//          authorName, content, created, state
export default function CommentRow({
  comment,
  selected = false,
  onSelectChange,
  onBlind,
  onDelete,
  onMoveToReport,
  // 조치 요청이 오가는 동안에는 행 버튼을 잠근다 (연달아 눌러 요청이 겹치는 것을 막는다)
  disabled = false,
}) {
  const isBlinded = comment.state === COMMENT_STATES.BLIND;
  const originHref = getCommentOriginHref(comment.postId, comment.commentId);

  return (
    <TableRow className="h-[46px] border-b border-[#b9b9b9] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#212121]">
      {/* 1. 선택 체크박스 */}
      <TableCell className="text-center">
        <RowCheckbox
          checked={selected}
          onCheckedChange={(checked) => onSelectChange?.(comment.commentId, checked)}
          label={`${comment.authorName}님의 댓글 선택`}
        />
      </TableCell>

      {/* 2. 게시판 명 · 글쓴이 - 관리자가 이름을 길게 지을 수 있다.
             table-fixed 라 칸은 안 늘어나지만, 잘라내지 않으면 글자가 옆 칸 위로 삐져나온다. */}
      <TableCell className="text-center">
        <span className="block truncate" title={comment.boardName}>
          {comment.boardName}
        </span>
      </TableCell>
      {/* 시안은 로그인 아이디(ch400)를 보여주지만 여기서는 이름을 쓴다.
          서버의 keyword 검색이 작성자 '이름'만 매칭하기 때문이다 —
          아이디를 보여주면 화면에 보이는 값을 그대로 검색해도 0건이 나온다.
          로그인 아이디·학번은 조치 확인 모달의 '대상 회원'에서 함께 보여준다.
          (서버 검색이 아이디도 매칭하게 되면 authorLoginId 로 되돌릴 것) */}
      <TableCell className="text-center">
        <span className="block truncate" title={comment.authorName}>
          {comment.authorName}
        </span>
      </TableCell>

      {/* 3. 댓글 내용 - 길어도 행 높이(46px)가 늘어나지 않도록 한 줄로 줄여 말줄임 처리한다. */}
      <TableCell className="text-center">
        <span title={comment.content} className="block truncate">
          {comment.content}
        </span>
      </TableCell>

      {/* 4. 댓글 작성일 · 상태 - 서버는 ISO 시각을 주므로 시안 형식(26.05.08)으로 바꿔 보여준다 */}
      <TableCell className="whitespace-nowrap text-center">
        {formatShortDotDate(comment.created)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {getCommentStateLabel(comment.state)}
      </TableCell>

      {/* 5. 원글 - 관리자 게시글 상세로 이동하고 해시로 이 댓글까지 짚어준다.
             사용자 상세로 보내면 블라인드·삭제된 댓글은 그려지지 않아 확인할 수 없다.
             열이 좁아 원글 제목 대신 'Link'로 두고, 링크 텍스트가 전부 같아
             보조기기에서 구분되지 않으므로 aria-label로 무엇인지 알려준다.
             (목록 응답에 원글 제목이 없어 제목은 보여줄 수 없다) */}
      <TableCell className="whitespace-nowrap text-center">
        {originHref ? (
          <Link
            href={originHref}
            aria-label={`${comment.authorName}님 댓글의 원글 보기`}
            className="underline decoration-solid underline-offset-2"
          >
            Link
          </Link>
        ) : (
          <span className="text-[#919191]">-</span>
        )}
      </TableCell>

      {/* 6. 관리 - 공개 댓글은 블라인드 · 삭제,
             이미 블라인드된 댓글은 신고 내역을 보고 판단하도록 신고 관리로 넘긴다. */}
      <TableCell className="text-center">
        {isBlinded ? (
          <RowActionButton
            className="min-w-[99px]"
            disabled={disabled}
            onClick={() => onMoveToReport?.(comment)}
          >
            신고 관리로 이동
          </RowActionButton>
        ) : (
          <div className="flex items-center justify-center gap-[8px]">
            <RowActionButton
              className="min-w-[60px]"
              disabled={disabled}
              onClick={() => onBlind?.(comment)}
            >
              블라인드
            </RowActionButton>
            <RowActionButton
              filled
              className="min-w-[37px]"
              disabled={disabled}
              onClick={() => onDelete?.(comment)}
            >
              삭제
            </RowActionButton>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
