'use client';

import Link from 'next/link';

import { TableCell, TableRow } from '@/components/ui/table';
import RowActionButton from '@/components/shared/admin/RowActionButton';
import RowCheckbox from '@/components/shared/admin/RowCheckbox';
import { formatShortDotDate } from '@/lib/boardDetail';
import { POST_STATES, getAdminPostDetailHref, getPostStateLabel } from '@/constants/adminPosts';

// post: 서버 응답 그대로 — postId, boardId, boardName, title, authorName,
//       commentCount, likeCount, viewCount, created, state
export default function PostRow({
  post,
  selected = false,
  onSelectChange,
  onBlind,
  onDelete,
  onMoveToReport,
  // 조치 요청이 오가는 동안에는 행 버튼을 잠근다 (연달아 눌러 요청이 겹치는 것을 막는다)
  disabled = false,
}) {
  const isBlinded = post.state === POST_STATES.BLIND;
  const detailHref = getAdminPostDetailHref(post.postId);

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

      {/* 2. 게시판 명 - 관리자가 이름을 길게 지을 수 있다.
             table-fixed 라 칸은 안 늘어나지만, 잘라내지 않으면 글자가 옆 칸 위로 삐져나온다. */}
      <TableCell className="text-center">
        <span className="block truncate" title={post.boardName}>
          {post.boardName}
        </span>
      </TableCell>

      {/* 3. 제목 - 누르면 관리자 전용 상세로 이동한다.
             사용자 상세는 블라인드·삭제 글을 보여주지 않고 익명글의 실작성자도 가리므로
             상태와 상관없이 관리자 화면으로 보낸다.
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

      {/* 4. 글쓴이 · 활동 수치
             시안은 로그인 아이디(ch400)를 보여주지만 여기서는 이름을 쓴다.
             서버의 keyword 검색이 작성자 '이름'만 매칭하기 때문이다 —
             아이디를 보여주면 화면에 보이는 값을 그대로 검색해도 0건이 나온다.
             로그인 아이디·학번은 조치 확인 모달의 '대상 회원'에서 함께 보여준다.
             (서버 검색이 아이디도 매칭하게 되면 authorLoginId 로 되돌릴 것) */}
      <TableCell className="text-center">
        <span className="block truncate" title={post.authorName}>
          {post.authorName}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {post.commentCount?.toLocaleString() ?? 0}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {post.likeCount?.toLocaleString() ?? 0}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {post.viewCount?.toLocaleString() ?? 0}
      </TableCell>

      {/* 5. 작성일 · 상태 - 서버는 ISO 시각을 주므로 시안 형식(26.05.08)으로 바꿔 보여준다 */}
      <TableCell className="whitespace-nowrap text-center">
        {formatShortDotDate(post.created)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {getPostStateLabel(post.state)}
      </TableCell>

      {/* 6. 관리 - 공개 글은 블라인드 · 삭제,
             이미 블라인드된 글은 신고 내역을 보고 판단하도록 신고 관리로 넘긴다. */}
      <TableCell className="text-center">
        {isBlinded ? (
          <RowActionButton
            className="min-w-[99px]"
            disabled={disabled}
            onClick={() => onMoveToReport?.(post)}
          >
            신고 관리로 이동
          </RowActionButton>
        ) : (
          <div className="flex items-center justify-center gap-[8px]">
            <RowActionButton
              className="min-w-[60px]"
              disabled={disabled}
              onClick={() => onBlind?.(post)}
            >
              블라인드
            </RowActionButton>
            <RowActionButton
              filled
              className="min-w-[44px]"
              disabled={disabled}
              onClick={() => onDelete?.(post)}
            >
              삭제
            </RowActionButton>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
