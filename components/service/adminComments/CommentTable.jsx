'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SelectAllCheckbox from '@/components/shared/admin/SelectAllCheckbox';
import CommentRow from './CommentRow';

// 체크박스 열까지 포함한 전체 열 개수 (빈 목록 안내문 가로 병합에 사용)
const COLUMN_COUNT = 8;

// 열 너비는 디자인(표 전체 915px)의 열 중심 좌표에서 역산한 비율을 기준으로 잡되,
// 댓글 내용은 20자 안팎이 들어가야 하고 관리 열은 버튼 두 개(60 + 37 + 간격)가 필요해서
// 그만큼 넓히고 나머지 열에서 덜어냈다.
const COLUMNS = [
  { key: 'boardName', label: '게시판 명', width: 'w-[10%]' },
  { key: 'author', label: '글쓴이', width: 'w-[10%]' },
  { key: 'content', label: '댓글 내용', width: 'w-[31%]' },
  { key: 'createdAt', label: '댓글 작성일', width: 'w-[10%]' },
  { key: 'status', label: '상태', width: 'w-[7%]' },
  { key: 'post', label: '원글', width: 'w-[7%]' },
  { key: 'actions', label: '관리', width: 'w-[17%]' },
];

export default function CommentTable({
  comments,
  selectedIds = [],
  onSelectOne,
  onSelectAll,
  onBlind,
  onDelete,
  onMoveToReport,
  loading = false,
  errorMessage = '',
}) {
  const allSelected = comments?.length > 0 && selectedIds.length === comments.length;

  // 로딩 · 에러 · 빈 목록일 때 body에 보여줄 안내문
  const emptyMessage = loading
    ? '불러오는 중입니다.'
    : errorMessage
      ? errorMessage
      : !comments?.length
        ? '등록된 댓글이 없습니다.'
        : '';

  return (
    <div className="overflow-x-auto border-t border-[#212121]">
      {/* 좁은 화면에서는 가로 스크롤로 처리한다.
          table-fixed로 둬야 위에서 잡은 열 너비가 그대로 지켜지고,
          댓글 내용이 길어도 행 높이(46px)가 늘어나지 않는다. */}
      <Table className="w-full min-w-[915px] table-fixed">
        <TableHeader>
          <TableRow className="h-[46px] border-b border-[#919191] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
            <TableHead className="w-[8%] text-center">
              <SelectAllCheckbox
                checked={allSelected}
                disabled={!comments?.length}
                onCheckedChange={onSelectAll}
                label="댓글 전체 선택"
              />
            </TableHead>

            {COLUMNS.map((column) => (
              <TableHead
                key={column.key}
                className={`${column.width} whitespace-nowrap text-center text-[#919191]`}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {emptyMessage ? (
            <TableRow className="h-[46px] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
              <TableCell colSpan={COLUMN_COUNT} className="text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            comments.map((comment) => (
              <CommentRow
                key={comment.commentId}
                comment={comment}
                selected={selectedIds.includes(comment.commentId)}
                onSelectChange={onSelectOne}
                onBlind={onBlind}
                onDelete={onDelete}
                onMoveToReport={onMoveToReport}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
