'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import SortSelect from '@/components/shared/board/boardList/SortSelect';
import SearchInput from '@/components/shared/board/boardList/SearchInput';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';
import { Button } from '@/components/ui/button';
import {
  actionButtonClass,
  listSectionClass,
  listTitleClass,
} from '@/components/shared/admin/CommunityListStyles';

import useAuthStore from '@/stores/useAuthStore';
import useAdminUsersStore from '@/stores/useAdminUsersStore';
import MemberTable from './MemberTable';
import MemberWithdrawModal from './MemberWithdrawModal';
import MemberSuspendModal from './MemberSuspendModal';
import MemberBanModal from './MemberBanModal';
import {
  LABEL_TO_MEMBER_TYPE,
  MEMBER_SORT_MAP,
  MEMBER_SORT_OPTIONS,
  ROLE_TO_ADMIN_LEVEL,
  mapApiMemberToRow,
} from '@/constants/adminMembers';

const PAGE_SIZE = 10;

export default function MemberListSection({ title = '회원 목록' }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  // 강제 탈퇴 확인 모달의 대상 회원 (null이면 닫힘)
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  // 회원 정지 모달의 대상 회원 (null이면 닫힘) — 정지 API는 단건이라 한 명만 담는다
  const [suspendTarget, setSuspendTarget] = useState(null);
  // 영구 차단 모달 열림 여부 (대상은 selectedIds)
  const [banOpen, setBanOpen] = useState(false);
  // 강제 탈퇴는 되돌릴 수 없어 관리 레벨 3 전용 (명세 140)
  const canWithdraw = useAuthStore((s) => s.adminLevel) >= 3;

  const {
    data,
    isLoading,
    error,
    fetchUsers,
    updateUser,
    suspendUser,
    banUsers,
    withdrawUser,
    clearError,
  } = useAdminUsersStore();

  // 서버 응답을 화면(MemberRow)이 쓰는 형태로 변환한다.
  const members = useMemo(() => (data?.members ?? []).map(mapApiMemberToRow), [data]);
  const totalPages = Math.max(1, Number(data?.totalPages) || 1);

  // 현재 페이지 목록을 서버에서 다시 불러온다. (검색·정렬·페이지 변경 / 조치 성공 후 재조회)
  const loadUsers = useCallback(async () => {
    try {
      await fetchUsers({
        page: currentPage,
        size: PAGE_SIZE,
        keyword: searchQuery.trim(),
        sort: MEMBER_SORT_MAP[sortOrder] ?? sortOrder,
      });
    } catch {
      // 실패 문구는 스토어 error로 노출된다
    }
  }, [fetchUsers, currentPage, searchQuery, sortOrder]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
    setSelectedIds(checked ? members.map((member) => member.memberId) : []);
  };

  // 목록에서 값을 바꿨을 때 → 서버에 부분 수정 요청 후 목록 갱신.
  // 서버(PATCH /api/admin/users/{id})가 받는 이름은 studentNo·memberType·adminLevel 이라 여기서 바꿔 준다.
  // Email 은 서버가 수정 대상에서 빼 두었고, ID 는 로그인 열쇠라 화면에서도 잠가 두었다.
  const FIELD_TO_PAYLOAD = {
    role: (value) => ({ adminLevel: ROLE_TO_ADMIN_LEVEL[value] }),
    enrollmentStatus: (value) => ({ memberType: LABEL_TO_MEMBER_TYPE[value] }),
    name: (value) => ({ name: value }),
    phone: (value) => ({ phone: value }),
    studentNumber: (value) => ({ studentNo: value }),
  };

  const handleFieldChange = async (memberId, field, value) => {
    const payload = FIELD_TO_PAYLOAD[field]?.(value);
    if (!payload) return;
    try {
      await updateUser(memberId, payload);
      await loadUsers();
    } catch {
      // 실패 문구는 스토어 error로 노출된다
    }
  };

  // 회원 정지 — 단건 처리라 정확히 한 명 선택했을 때만 열린다 (버튼 disabled로 보장)
  const handleSuspendClick = () => {
    const target = members.find((member) => member.memberId === selectedIds[0]);
    if (target) {
      clearError();
      setSuspendTarget(target);
    }
  };

  const handleSuspendSubmit = async ({ endDate }) => {
    if (!suspendTarget) return;
    try {
      await suspendUser(suspendTarget.memberId, endDate);
      setSuspendTarget(null);
      setSelectedIds([]);
      await loadUsers();
    } catch {
      // 실패 문구는 스토어 error로 노출된다
    }
  };

  // 영구 차단 — all-or-nothing 다중 처리 (선택된 회원 전체)
  const handleBanSubmit = async () => {
    try {
      await banUsers(selectedIds);
      setBanOpen(false);
      setSelectedIds([]);
      await loadUsers();
    } catch {
      // 실패 문구는 스토어 error로 노출된다
    }
  };

  // 강제 탈퇴 — 되돌릴 수 없는 처리(개인정보 즉시 파기)라 확인 모달을 거친다
  const handleWithdrawConfirm = async () => {
    if (!withdrawTarget) return;
    try {
      await withdrawUser(withdrawTarget.memberId);
      setSelectedIds((prev) => prev.filter((id) => id !== withdrawTarget.memberId));
      setWithdrawTarget(null);
      await loadUsers();
    } catch {
      // 실패 문구는 스토어 error로 노출된다
    }
  };

  // 영구 차단 모달에 넘길 선택 회원 객체들
  const selectedMembers = useMemo(
    () => members.filter((member) => selectedIds.includes(member.memberId)),
    [members, selectedIds]
  );

  // 목록이 비었을 때(초기 로딩·조회 실패)만 테이블 본문에 안내를 띄운다.
  // 조치 중(isLoading)에는 이미 그려진 목록을 로딩 문구로 덮지 않는다.
  const isListEmpty = members.length === 0;

  return (
    <div className={listSectionClass}>
      <h2 className={listTitleClass}>{title}</h2>

      {/* 정렬 · 검색 (왼쪽) / 회원 정지 · 영구 차단 (오른쪽)
          폭이 모자라면 ① 검색창이 120px 까지 줄고 ② 그래도 안 되면 버튼 묶음이 아랫줄 오른쪽으로 내려간다 — 겹치지 않는다.
          예전엔 검색창이 296px 고정이라 중간 폭에서 버튼 위에 겹쳐 그려졌다 (PM, 2026-09-26) */}
      <div className="mb-[5px] mt-[5px] flex flex-col gap-3 md:mb-4 md:mt-[10px] md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
        <div className="flex min-w-0 flex-1 basis-[260px] flex-row items-center gap-2">
          <div className="w-[110px] shrink-0 sm:w-auto">
            <SortSelect
              value={sortOrder}
              onValueChange={handleSortChange}
              options={MEMBER_SORT_OPTIONS}
            />
          </div>
          <div className="min-w-[120px] flex-1 md:max-w-[296px]">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="ID / 이름 검색"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-center gap-2 md:ml-auto">
          {/* 회원 정지는 단건 처리 → 한 명 선택했을 때만 활성화 */}
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || selectedIds.length !== 1}
            onClick={handleSuspendClick}
            className={`${actionButtonClass} border-[#212121] text-[#212121]`}
          >
            회원 정지
          </Button>
          {/* 영구 차단은 다중 처리 → 한 명 이상 선택했을 때 활성화 */}
          <Button
            type="button"
            disabled={isLoading || selectedIds.length === 0}
            onClick={() => {
              clearError();
              setBanOpen(true);
            }}
            className={`${actionButtonClass} bg-[#212121] text-white`}
          >
            영구 차단
          </Button>
        </div>
      </div>

      {/* 목록이 남아 있는 상태에서의 조치 실패는 목록을 지우지 않고 위에 문구로 알린다 */}
      {error && !isListEmpty && (
        <p className="mb-2 text-[14px] leading-[1.6] tracking-[-0.02em] text-[#e02d2d]">{error}</p>
      )}

      <MemberTable
        members={members}
        selectedIds={selectedIds}
        onSelectOne={handleSelectOne}
        onSelectAll={handleSelectAll}
        onFieldChange={handleFieldChange}
        onWithdraw={(member) => {
          clearError();
          setWithdrawTarget(member);
        }}
        canWithdraw={canWithdraw}
        loading={isLoading && isListEmpty}
        errorMessage={!isLoading && isListEmpty ? (error ?? '') : ''}
      />

      <MemberSuspendModal
        open={Boolean(suspendTarget)}
        member={suspendTarget}
        error={error}
        onClose={() => {
          clearError();
          setSuspendTarget(null);
        }}
        onSubmit={handleSuspendSubmit}
      />

      <MemberBanModal
        open={banOpen}
        members={selectedMembers}
        error={error}
        onClose={() => {
          clearError();
          setBanOpen(false);
        }}
        onSubmit={handleBanSubmit}
      />

      <MemberWithdrawModal
        member={withdrawTarget}
        error={error}
        onConfirm={handleWithdrawConfirm}
        onCancel={() => {
          clearError();
          setWithdrawTarget(null);
        }}
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
