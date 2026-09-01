'use client';

import { InputGroup, InputGroupInput, InputGroupButton } from '@/components/ui/input-group';
import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = '검색어를 입력하세요' }) {
  return (
    <InputGroup className="h-12 w-full max-w-full md:h-[52px] md:max-w-80">
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="!text-[16px] leading-[1.6] tracking-[-0.02em] text-[#9E9E9E]"
      />
      <InputGroupButton size="icon-sm">
        <Search className="text-[#212121]" />
      </InputGroupButton>
    </InputGroup>
  );
}
