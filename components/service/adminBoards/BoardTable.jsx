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

import BoardRow from './BoardRow';

// 순서 열까지 포함한 전체 열 개수 (빈 목록 안내문 가로 병합에 사용)
const COLUMN_COUNT = 6;

export default function BoardTable({
  boards,
  onEdit,
  draggingId = null,
  dropTargetId = null,
  dropPosition = null,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  loading = false,
  // 목록은 그대로 두고 저장만 진행 중일 때 (행 버튼과 드래그만 잠근다)
  saving = false,
  errorMessage = '',
}) {
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
          {/* 열 너비는 시안의 열 제목 중심 좌표에서 역산했다.
              인접한 중심의 중간을 열 경계로 보면 28 / 18 / 14 / 15 / 13 / 12 % 가 나온다. */}
          <TableRow className="h-[46px] border-b border-[#919191] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
            <TableHead className="w-[28%] whitespace-nowrap text-center text-[#919191]">
              게시판 명
            </TableHead>
            <TableHead className="w-[18%] whitespace-nowrap text-center text-[#919191]">
              게시글 수
            </TableHead>
            <TableHead className="w-[14%] whitespace-nowrap text-center text-[#919191]">
              열람 권한
            </TableHead>
            <TableHead className="w-[15%] whitespace-nowrap text-center text-[#919191]">
              작성 권한
            </TableHead>
            <TableHead className="w-[13%] whitespace-nowrap text-center text-[#919191]">
              관리
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
                key={board.boardId}
                board={board}
                onEdit={onEdit}
                disabled={saving}
                isDragging={draggingId === board.boardId}
                isDropTarget={dropTargetId === board.boardId && draggingId !== board.boardId}
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
