"use client";

import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";

export default function SearchInput() {
  return (
    <InputGroup className="min-w-40 max-w-80 h-[52px]">
      <InputGroupInput
        placeholder="검색어를 입력하세요"
        className="text-[16px] leading-[1.6] tracking-[-0.02em] text-[#9E9E9E]"
      />
      <InputGroupButton size="icon-sm">
        <Search className="text-[#212121]" />
      </InputGroupButton>
    </InputGroup>
  );
}
