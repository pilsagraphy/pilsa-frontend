'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 목록 맨 위의 '전체' 는 이 컴포넌트가 직접 놓는다(필터 해제를 뜻하는 value='all').
// 그런데 게시판에 같은 이름의 카테고리 행이 만들어져 있으면 '전체' 가 두 번 보이고,
// 두 번째 것은 그 카테고리로 거르기 때문에 아무 글도 안 나온다(= 동작하지 않는 것처럼 보인다).
// 이름이 겹치는 행은 화면에서 뺀다 — 골라도 얻을 게 없는 선택지라서다.
const ALL_LABEL = '전체';
const isAllLabel = (name) => (name ?? '').trim() === ALL_LABEL;

// 게시판 카테고리 선택.
// categories: [{ categoryId, name }] (GET /api/user/boards/{boardId}/categories)
// value: 'all' 또는 String(categoryId)
export default function CategorySelect({ categories = [], value, onValueChange }) {
  const options = categories.filter((category) => !isAllLabel(category.name));

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 w-full min-w-0 shrink-0 text-[15px] leading-[1.6] tracking-[-0.02em] text-[#212121] sm:w-[120px] xl:h-[52px] xl:w-[135px] xl:text-[16px] [&>span]:text-[#212121]">
        <SelectValue placeholder="카테고리" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">{ALL_LABEL}</SelectItem>
          {options.map((category) => (
            <SelectItem key={category.categoryId} value={String(category.categoryId)}>
              {category.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
