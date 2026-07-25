"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CategorySelect({ boardType, value, onValueChange }) {
  const categoryMap = {
    free: [
      { value: "all", label: "전체" },
      { value: "자랑", label: "자랑" },
      { value: "정보", label: "정보" },
      { value: "질문", label: "질문" },
      { value: "일상", label: "일상" },
      { value: "모임", label: "모임" },
    ],
    info: [
      { value: "all", label: "전체" },
      { value: "공지", label: "공지" },
      { value: "꿀팁", label: "꿀팁" },
      { value: "질문/상담", label: "질문/상담" },
      { value: "취업/진로", label: "취업/진로" },
    ],
  };

  const categories = categoryMap[boardType] || [];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 w-full min-w-0 shrink-0 text-[15px] leading-[1.6] tracking-[-0.02em] text-[#212121] sm:w-[120px] md:h-[52px] md:w-[135px] md:text-[16px] [&>span]:text-[#212121]">
        <SelectValue placeholder="카테고리" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {categories.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
