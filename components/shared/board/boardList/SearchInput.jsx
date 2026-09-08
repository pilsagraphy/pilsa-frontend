'use client';

import { InputGroup, InputGroupInput, InputGroupButton } from '@/components/ui/input-group';
import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = '검색어를 입력하세요' }) {
  return (
    <InputGroup className="h-12 w-full max-w-full md:h-[52px] md:max-w-80">
      {/* min-w-0 이 없으면 input 의 기본 폭(size 속성에서 나오는 약 170px)이 최소 너비가 되어
          칸이 좁아질 때 줄어들지 않고 옆 요소 위로 넘친다. */}
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 !text-[16px] leading-[1.6] tracking-[-0.02em] text-[#9E9E9E]"
      />
      <InputGroupButton size="icon-sm">
        <Search className="text-[#212121]" />
      </InputGroupButton>
    </InputGroup>
  );
}
