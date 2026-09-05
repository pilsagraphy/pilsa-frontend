'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 게시판 카테고리 선택.
// categories: [{ categoryId, name }] (GET /api/user/boards/{boardId}/categories)
// value: 'all' 또는 String(categoryId)
export default function CategorySelect({ categories = [], value, onValueChange }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 w-full min-w-0 shrink-0 text-[15px] leading-[1.6] tracking-[-0.02em] text-[#212121] sm:w-[120px] md:h-[52px] md:w-[135px] md:text-[16px] [&>span]:text-[#212121]">
        <SelectValue placeholder="카테고리" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">전체</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.categoryId} value={String(category.categoryId)}>
              {category.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
