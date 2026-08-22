'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Menu } from 'lucide-react';

import SelectAllCheckbox from '@/components/shared/admin/SelectAllCheckbox';
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
  dropPosition = null,
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
              <SelectAllCheckbox
                checked={allSelected}
                disabled={!boards?.length}
                onCheckedChange={onSelectAll}
                label="게시판 전체 선택"
              />
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
              <TableCell colSpan={COLUMN_COUNT} className="text-center text-muted-foreground">
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
                dropPosition={dropPosition}
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
