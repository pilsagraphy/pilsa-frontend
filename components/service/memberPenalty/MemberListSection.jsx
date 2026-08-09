'use client';
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { InputGroup, InputGroupInput, InputGroupButton } from '@/components/ui/input-group';
import MemberList from './MemberList';
import { SANCTIONED_MEMBERS } from '@/mocks/memberPenalty';

// 회원목록(개별 회원 = MemberList)을 합치고, 검색으로 회원을 선택할 수 있는 컴포넌트.
// selectedId / onSelect 로 선택 회원을 상위와 공유한다.
export default function MemberListSection({
  members = SANCTIONED_MEMBERS,
  selectedId,
  onSelect,
}) {
  const [keyword, setKeyword] = useState('');
  const [focused, setFocused] = useState(false);

  // 검색어(ID / 닉네임 / 이름)와 일치하는 회원을 선택 상태로 만든다.
  // 입력 즉시가 아니라, 엔터 또는 돋보기 버튼을 눌렀을 때만 실행된다.
  const runSearch = () => {
    const query = keyword.trim().toLowerCase();
    if (!query) return;

    const found = members.find(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.loginId.toLowerCase().includes(query) ||
        m.nickname.toLowerCase().includes(query),
    );
    if (found) onSelect?.(found.memberId);

    // 검색(엔터/돋보기) 실행 후에는 검색창을 비워 새 검색어를 입력할 수 있게 한다
    setKeyword('');
  };

  return (
    <div className="flex w-[270px] shrink-0 flex-col gap-[16px] font-['Pretendard',sans-serif]">
      {/* 이 컴포넌트의 정체성: 목록 */}
      <h3 className="text-[18px] tracking-[-0.36px] text-[#212121]">목록</h3>

      {/* 검색창: 포커스 시 placeholder 숨김 / 엔터·돋보기 클릭 시에만 검색 회원 선택 */}
      <InputGroup className="h-[52px] w-full">
        <InputGroupInput
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder={focused ? '' : 'ID / 닉네임 / 이름 검색'}
          className="!text-[16px] leading-[1.6] tracking-[-0.02em] text-[#9E9E9E]"
        />
        <InputGroupButton size="icon-sm" onClick={runSearch} aria-label="검색">
          <Search className="text-[#212121]" />
        </InputGroupButton>
      </InputGroup>

      {/* 스크롤 범위(디자인의 가장 긴 회색 세로 바). 회원이 많으면 세로 스크롤 (화살표 없이) */}
      <div className="mp-scroll-y h-[720px] overflow-x-hidden overflow-y-auto pr-[6px]">
        {members.map((member) => (
          <MemberList
            key={member.memberId}
            member={member}
            selected={member.memberId === selectedId}
            dimmed={selectedId != null && member.memberId !== selectedId}
            onClick={() => onSelect?.(member.memberId)}
          />
        ))}
      </div>
    </div>
  );
}
