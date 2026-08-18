'use client';

import { useMemo, useState } from 'react';

import SortSelect from '@/components/shared/board/SortSelect';
import SearchInput from '@/components/shared/board/SearchInput';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';
import { Button } from '@/components/ui/button';
import {
  actionButtonClass,
  listSectionClass,
  listTitleClass,
} from '@/components/shared/admin/CommunityListStyles';

import MemberTable from './MemberTable';
import { DUMMY_MEMBERS, MEMBER_SORT_OPTIONS } from '@/constants/adminMembers';

const PAGE_SIZE = 10;

export default function MemberListSection({ title = '회원 목록' }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // 행에서 재학상태·권한을 바꾼 결과가 화면에 남아야 해서 목록을 상태로 들고 간다.
  const [members, setMembers] = useState(DUMMY_MEMBERS);

  // TODO: API 연동 시 DUMMY_MEMBERS 대신 서버 응답(목록·totalPages)을 사용하고,
  //       검색·정렬·페이지네이션도 서버에 위임할 것. (BoardSection.jsx 참고)
  const filteredMembers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    const matched = keyword
      ? members.filter(
          (member) =>
            member.loginId.toLowerCase().includes(keyword) ||
            member.name.toLowerCase().includes(keyword)
        )
      : members;

    // memberId가 클수록 최근 가입 → 최신순은 내림차순, 오래된순은 오름차순.
    return [...matched].sort((a, b) =>
      sortOrder === 'oldest' ? a.memberId - b.memberId : b.memberId - a.memberId
    );
  }, [members, searchQuery, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));

  const pagedMembers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMembers.slice(start, start + PAGE_SIZE);
  }, [filteredMembers, currentPage]);

  // 목록이 바뀌면 화면에 없는 회원이 선택된 채로 남지 않도록 선택을 비운다.
  const resetToFirstPage = () => {
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleSortChange = (value) => {
    setSortOrder(value);
    resetToFirstPage();
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    resetToFirstPage();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedIds([]);
  };

  const handleSelectOne = (memberId, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, memberId] : prev.filter((id) => id !== memberId)
    );
  };

  // 전체 선택은 현재 페이지에 보이는 회원만 대상으로 한다.
  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? pagedMembers.map((member) => member.memberId) : []);
  };

  // 행에서 재학상태·권한 select로 값을 바꿨을 때
  // TODO: API 연동 시 서버에 변경 요청을 보내고 응답으로 목록을 갱신할 것
  const handleFieldChange = (memberId, field, value) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.memberId === memberId ? { ...member, [field]: value } : member
      )
    );
  };

  return (
    <div className={listSectionClass}>
      <h2 className={listTitleClass}>{title}</h2>

      {/* 정렬 · 검색 (왼쪽) / 회원 정지 · 영구 차단 (오른쪽) */}
      <div className="mb-[5px] mt-[5px] flex flex-col gap-3 md:mb-4 md:mt-[10px] md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <SortSelect
            value={sortOrder}
            onValueChange={handleSortChange}
            options={MEMBER_SORT_OPTIONS}
          />
          <div className="min-w-0 sm:w-[296px]">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="ID / 이름 검색"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* TODO: 선택한 회원(selectedIds)에 대한 정지 · 차단 처리 연결.
                    선택이 없을 때 막는 처리도 이때 함께 넣을 것. */}
          <Button
            type="button"
            variant="outline"
            className={`${actionButtonClass} border-[#212121] text-[#212121]`}
          >
            회원 정지
          </Button>
          <Button type="button" className={`${actionButtonClass} bg-[#212121] text-white`}>
            영구 차단
          </Button>
        </div>
      </div>

      <MemberTable
        members={pagedMembers}
        selectedIds={selectedIds}
        onSelectOne={handleSelectOne}
        onSelectAll={handleSelectAll}
        onFieldChange={handleFieldChange}
      />

      <div className="mt-6 mb-16 flex justify-center md:mt-[34px] md:mb-[120px]">
        <PaginationWithEllipsis
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
