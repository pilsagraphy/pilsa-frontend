'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

// 모바일 전용 게시판 컨트롤 (피그마: 정렬·카테고리 버튼 + 검색, 한 줄)
// 데스크톱 컨트롤(52px)과 별개. 공용 SortSelect/CategorySelect 는 다른 화면과 공유하므로 건드리지 않는다.
const SORT_OPTIONS = [
  { value: 'created', label: '최신순' },
  { value: 'viewCount', label: '조회순' },
];

// 34px 높이 · 테두리 · 라운드 4 · 13px (피그마 Button(W))
const triggerClass =
  'flex h-[34px] w-[80px] shrink-0 items-center justify-between gap-1 rounded-[4px] border border-[#B9B9B9] bg-white px-[10px] text-[13px] leading-none text-[#212121] [&>span]:truncate';

export default function BoardControlsMobile({
  sortOrder,
  onSortChange,
  categoryMode,
  categories = [],
  category,
  onCategoryChange,
  searchInput,
  onSearchChange,
}) {
  return (
    <div className="flex items-center gap-[10px]">
      {/* 정렬 */}
      <Select value={sortOrder} onValueChange={onSortChange}>
        <SelectTrigger className={triggerClass} aria-label="정렬">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* 카테고리 (카테고리 게시판만) — 버튼엔 '카테고리' 라벨, 특정 카테고리 선택 시 그 이름 표시 */}
      {categoryMode && (
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className={triggerClass} aria-label="카테고리">
            <span className="truncate">
              {category === 'all'
                ? '카테고리'
                : (categories.find((c) => String(c.categoryId) === category)?.name ?? '카테고리')}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">전체</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.categoryId} value={String(c.categoryId)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      {/* 검색 */}
      <div className="flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-[4px] border border-[#B9B9B9] bg-white px-[16px]">
        <input
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="검색어를 입력하세요"
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-none text-[#212121] outline-none placeholder:text-[#9E9E9E]"
        />
        <Search size={18} className="shrink-0 text-[#212121]" />
      </div>
    </div>
  );
}
