'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, RefreshCcw } from 'lucide-react';
import { InputGroup, InputGroupInput, InputGroupButton } from '@/components/ui/input-group';
import MemberList from './MemberList';
import useSanctionStore from '@/stores/useSanctionStore';

// 제재 회원 목록 API 응답(userId, loginId, name, tag ...)을
// 목록 컴포넌트(MemberList)가 쓰는 모양으로 슬롯에 꽂아 넣는다.
// tag: permanent | temporary | caution → 뱃지는 정지/주의 두 종류
function toMember(user) {
  return {
    memberId: user.userId,
    name: user.name,
    loginId: user.loginId,
    currentStatus: user.tag === 'caution' ? '주의' : '정지',
  };
}

// 회원목록(개별 회원 = MemberList)을 합치고, 검색으로 목록을 한정할 수 있는 컴포넌트.
// selectedId / onSelect 로 선택 회원을 상위와 공유한다.
export default function MemberListSection({ selectedId, onSelect }) {
  const { isLoading, data, error } = useSanctionStore((s) => s.users);
  const fetchSanctionedUsers = useSanctionStore((s) => s.fetchSanctionedUsers);

  const [keyword, setKeyword] = useState('');
  const [focused, setFocused] = useState(false);

  // 화면에 진입하면 제재 회원 목록을 받아온다.
  useEffect(() => {
    fetchSanctionedUsers();
  }, [fetchSanctionedUsers]);

  // API 응답을 목록이 쓰는 모양으로 변환
  const members = useMemo(() => data.map(toMember), [data]);

  const query = keyword.trim().toLowerCase();

  // 검색어가 회원정보(이름/아이디)의 일부에 해당하면, 그 회원들로 목록을 한정한다. (부분 검색)
  const visibleMembers = useMemo(() => {
    if (!query) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.loginId.toLowerCase().includes(query),
    );
  }, [members, query]);

  // x 버튼: 검색어만 초기화(선택 회원은 유지) → 전체 목록 노출
  const clearKeyword = () => setKeyword('');

  // 초기화 버튼: 검색어 + 보이는 목록 + 선택 회원 초기화 → 맨 위 회원을 선택
  const handleReset = () => {
    setKeyword('');
    if (members[0]) onSelect?.(members[0].memberId);
  };

  return (
    <div className="flex w-[270px] shrink-0 flex-col gap-[16px] font-['Pretendard',sans-serif]">
      {/* '목록' + 우측 초기화 버튼(돋보기와 같은 열, 같은 색) */}
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] tracking-[-0.36px] text-[#212121]">목록</h3>
        <button
          type="button"
          onClick={handleReset}
          aria-label="목록 초기화"
          className="grid size-[24px] place-content-center text-[#212121]"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      {/* 검색창: 입력 즉시 목록 한정(부분 검색), 엔터/돋보기를 눌러도 검색어 유지.
          검색어가 있으면 돋보기 왼쪽에 x 버튼 노출 */}
      <InputGroup className="h-[52px] w-full">
        <InputGroupInput
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault(); // 엔터로도 검색어를 초기화하지 않고 유지
          }}
          placeholder={focused ? '' : 'ID / 이름 검색'}
          className="!text-[16px] leading-[1.6] tracking-[-0.02em] text-[#212121] placeholder:text-[#9E9E9E]"
        />
        {keyword && (
          <button
            type="button"
            onClick={clearKeyword}
            aria-label="검색어 지우기"
            className="mr-[2px] grid size-[18px] shrink-0 place-content-center rounded-full bg-[#c4c4c4]"
          >
            <X size={12} strokeWidth={2.5} className="text-white" />
          </button>
        )}
        <InputGroupButton size="icon-sm" aria-label="검색">
          <Search className="text-[#212121]" />
        </InputGroupButton>
      </InputGroup>

      {/* 스크롤 범위. 검색으로 한정된 목록을 노출 (세로 스크롤, 화살표 없이) */}
      <div className="mp-scroll-y h-[720px] overflow-x-hidden overflow-y-auto pr-[6px]">
        {isLoading ? (
          // 1) 로딩 중
          <div className="flex h-full items-center justify-center text-[16px] tracking-[-0.32px] text-[#919191]">
            불러오는 중…
          </div>
        ) : error ? (
          // 2) 에러 (스토어가 넣어준 한국어 문장을 그대로 보여준다)
          <div className="flex h-full items-center justify-center px-[6px] text-center text-[16px] tracking-[-0.32px] text-[#ae0000]">
            {error}
          </div>
        ) : members.length === 0 ? (
          // 3) 데이터 없음
          <div className="flex h-full items-center justify-center text-[16px] tracking-[-0.32px] text-[#919191]">
            제재 회원이 없습니다.
          </div>
        ) : visibleMembers.length === 0 ? (
          // 3-1) 데이터는 있지만 검색 결과가 없음
          <div className="flex h-full items-center justify-center text-[16px] tracking-[-0.32px] text-[#919191]">
            검색 결과가 없습니다.
          </div>
        ) : (
          // 4) 데이터 있음
          visibleMembers.map((member) => (
            <MemberList
              key={member.memberId}
              member={member}
              selected={member.memberId === selectedId}
              dimmed={selectedId != null && member.memberId !== selectedId}
              onClick={() => onSelect?.(member.memberId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
