'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 게시판 필터 — 카테고리(CategorySelect)와 다르다.
// CategorySelect 는 한 게시판 안의 말머리(categoryId)를, 이쪽은 게시판 자체(boardId)를 고른다.
// 게시판은 DB 로 정의되므로 목록은 GET /api/user/boards 로 받아서 넘긴다 (하드코딩 금지).

// '전체 게시판' 을 뜻하는 값 — Select 는 빈 문자열을 값으로 쓸 수 없어 문자열 상수를 둔다
export const BOARD_FILTER_ALL = 'all';

export default function BoardSelect({ boards = [], value, onValueChange }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 w-full min-w-0 shrink-0 text-[15px] leading-[1.6] tracking-[-0.02em] text-[#212121] sm:w-[120px] md:h-[52px] md:w-[135px] md:text-[16px] [&>span]:text-[#212121]">
        <SelectValue placeholder="전체 게시판" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={BOARD_FILTER_ALL}>전체 게시판</SelectItem>
          {boards.map((board) => (
            <SelectItem key={board.boardId} value={String(board.boardId)}>
              {board.boardName}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
