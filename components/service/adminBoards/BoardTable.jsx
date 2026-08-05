'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, Menu } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import BoardRow from './BoardRow';

// 체크박스 · 순서 열까지 포함한 전체 열 개수 (빈 목록 안내문 가로 병합에 사용)
const COLUMN_COUNT = 6;

export default function BoardTable({
  boards,
  selectedIds = [],
  onSelectOne,
  onSelectAll,
  onFieldChange,
  draggingId = null,
  dropTargetId = null,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  loading = false,
  errorMessage = '',
}) {
  const allSelected = boards?.length > 0 && selectedIds.length === boards.length;

  // 로딩 · 에러 · 빈 목록일 때 body에 보여줄 안내문
  const emptyMessage = loading
    ? '불러오는 중입니다.'
    : errorMessage
      ? errorMessage
      : !boards?.length
        ? '등록된 게시판이 없습니다.'
        : '';

  return (
    <div className="overflow-x-auto border-t border-[#212121]">
      <Table className="w-full min-w-[915px]">
        <TableHeader>
          {/* 열 너비는 디자인(표 전체 915px) 좌표에서 역산한 비율을 쓴다.
              64 / 359 / 99 / 179 / 99 / 115 px → 7 / 39 / 11 / 20 / 11 / 12 % */}
          <TableRow className="h-[46px] border-b border-[#919191] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
            <TableHead className="w-[7%] text-center">
              {/* 전체 선택 체크박스.
                  디자인처럼 선택 전에도 연한 체크 표시가 보이도록,
                  체크되지 않은 상태에서만 회색 체크 아이콘을 겹쳐 보여준다. */}
              <span className="relative inline-flex">
                <Checkbox
                  checked={allSelected}
                  disabled={!boards?.length}
                  onCheckedChange={(checked) => onSelectAll?.(checked === true)}
                  aria-label="게시판 전체 선택"
                  className="size-6 rounded-[4px] border-[#919191] data-[state=checked]:border-[#212121] data-[state=checked]:bg-[#212121]"
                />
                <Check
                  aria-hidden
                  className="pointer-events-none absolute inset-0 m-auto size-4 text-[#dedede] peer-data-[state=checked]:hidden"
                />
              </span>
            </TableHead>
            <TableHead className="w-[39%] whitespace-nowrap text-center text-[#919191]">
              게시판 명
            </TableHead>
            <TableHead className="w-[11%] whitespace-nowrap text-center text-[#919191]">
              게시글 수
            </TableHead>
            <TableHead className="w-[20%] whitespace-nowrap text-center text-[#919191]">
              열람 권한
            </TableHead>
            <TableHead className="w-[11%] whitespace-nowrap text-center text-[#919191]">
              작성 권한
            </TableHead>
            {/* 순서 변경 열 - 제목 대신 디자인대로 아이콘만 표시 (헤더는 드래그 대상이 아니라 장식) */}
            <TableHead className="w-[12%] text-center">
              <span aria-hidden className="inline-flex text-[#dedede]">
                <Menu className="size-5" />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {emptyMessage ? (
            <TableRow className="h-[46px] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
              <TableCell
                colSpan={COLUMN_COUNT}
                suppressHydrationWarning
                className="text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            boards.map((board) => (
              <BoardRow
                key={board.id}
                board={board}
                selected={selectedIds.includes(board.id)}
                onSelectChange={onSelectOne}
                onFieldChange={onFieldChange}
                isDragging={draggingId === board.id}
                isDropTarget={dropTargetId === board.id && draggingId !== board.id}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
