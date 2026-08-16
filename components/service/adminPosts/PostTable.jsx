'use client';

import { Check } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import PostRow from './PostRow';

// 체크박스 열까지 포함한 전체 열 개수 (빈 목록 안내문 가로 병합에 사용)
const COLUMN_COUNT = 10;

// 열 너비는 디자인(표 전체 915px)의 열 중심 좌표에서 역산한 비율을 기준으로 잡되,
// 제목은 글자가 길어 실제로 더 필요하고 관리 열은 버튼 두 개(60 + 44 + 간격)가 들어가야 해서
// 그만큼 넓히고 나머지 열에서 덜어냈다.
const COLUMNS = [
  { key: 'boardName', label: '게시판 명', width: 'w-[11%]' },
  { key: 'title', label: '제목', width: 'w-[21%]' },
  { key: 'author', label: '글쓴이', width: 'w-[9%]' },
  { key: 'commentCount', label: '댓글', width: 'w-[7%]' },
  { key: 'likeCount', label: '좋아요', width: 'w-[7%]' },
  { key: 'viewCount', label: '조회수', width: 'w-[7%]' },
  { key: 'createdAt', label: '작성일', width: 'w-[8%]' },
  { key: 'status', label: '상태', width: 'w-[7%]' },
  { key: 'actions', label: '관리', width: 'w-[16%]' },
];

export default function PostTable({
  posts,
  selectedIds = [],
  onSelectOne,
  onSelectAll,
  onBlind,
  onDelete,
  onMoveToReport,
  loading = false,
  errorMessage = '',
}) {
  const allSelected = posts?.length > 0 && selectedIds.length === posts.length;

  // 로딩 · 에러 · 빈 목록일 때 body에 보여줄 안내문
  const emptyMessage = loading
    ? '불러오는 중입니다.'
    : errorMessage
      ? errorMessage
      : !posts?.length
        ? '등록된 게시글이 없습니다.'
        : '';

  return (
    <div className="overflow-x-auto border-t border-[#212121]">
      {/* 열이 10개라 좁은 화면에서는 가로 스크롤로 처리한다.
          table-fixed로 둬야 위에서 잡은 열 너비가 그대로 지켜지고,
          제목이 길어도 행 높이(46px)가 늘어나지 않는다. */}
      <Table className="w-full min-w-[915px] table-fixed">
        <TableHeader>
          <TableRow className="h-[46px] border-b border-[#919191] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
            <TableHead className="w-[8%] text-center">
              {/* 전체 선택 체크박스.
                  디자인처럼 선택 전에도 연한 체크 표시가 보이도록,
                  체크되지 않았을 때만 회색 체크 아이콘을 겹쳐 보여준다. */}
              <span className="relative inline-flex align-middle">
                <Checkbox
                  checked={allSelected}
                  disabled={!posts?.length}
                  onCheckedChange={(checked) => onSelectAll?.(checked === true)}
                  aria-label="게시글 전체 선택"
                  className="size-6 rounded-[4px] border-[#919191] data-[state=checked]:border-[#212121] data-[state=checked]:bg-[#212121]"
                />
                {!allSelected && (
                  <Check
                    aria-hidden
                    className="pointer-events-none absolute inset-0 m-auto size-4 text-[#dedede]"
                  />
                )}
              </span>
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
            posts.map((post) => (
              <PostRow
                key={post.postId}
                post={post}
                selected={selectedIds.includes(post.postId)}
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
