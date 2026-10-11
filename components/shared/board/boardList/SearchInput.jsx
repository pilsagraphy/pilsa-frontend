'use client';

import { InputGroup, InputGroupInput, InputGroupButton } from '@/components/ui/input-group';
import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = '검색어를 입력하세요' }) {
  return (
    <InputGroup className="h-12 w-full max-w-full lg:h-[52px] lg:max-w-80">
      {/* min-w-0 이 없으면 input 의 기본 폭(size 속성에서 나오는 약 170px)이 최소 너비가 되어
          칸이 좁아질 때 줄어들지 않고 옆 요소 위로 넘친다.
          입력한 글자는 본문색(ink), 안내 문구만 연하게 — 입력한 글자까지 회색이라 잘 안 보였다 (테스터 제보 10/11) */}
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 !text-[16px] leading-[1.6] tracking-[-0.02em] text-ink placeholder:text-ink-3"
      />
      <InputGroupButton size="icon-sm">
        <Search className="text-ink" />
      </InputGroupButton>
    </InputGroup>
  );
}
