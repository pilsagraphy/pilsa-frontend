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
      { value: "공대", label: "공대" },
      { value: "소융대", label: "소융대" },
      { value: "생과대", label: "생과대" },
      { value: "외대", label: "외대" },
      { value: "예디대", label: "예디대" },
      { value: "전정대", label: "전정대" },
    ],
  };

  const categories = categoryMap[boardType] || [];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[135px] h-[52px] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#212121] [&>span]:text-[#212121]">
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
