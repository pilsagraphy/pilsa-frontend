'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SelectAllCheckbox from '@/components/shared/admin/SelectAllCheckbox';
import MemberRow from './MemberRow';
import MemberCardList from './MemberCardList';

// 체크박스 열까지 포함한 전체 열 개수 (빈 목록 안내문 가로 병합에 사용)
const COLUMN_COUNT = 12;

export default function MemberTable({
  members,
  selectedIds = [],
  onSelectOne,
  onSelectAll,
  onFieldChange,
  onWithdraw,
  canWithdraw = false,
  loading = false,
  errorMessage = '',
}) {
  const allSelected = members?.length > 0 && selectedIds.length === members.length;

  // 로딩 · 에러 · 빈 목록일 때 body에 보여줄 안내문
  const emptyMessage = loading
    ? '불러오는 중입니다.'
    : errorMessage
      ? errorMessage
      : !members?.length
        ? '등록된 회원이 없습니다.'
        : '';

  const allSelectedLabel = allSelected ? '전체 해제' : '전체 선택';

  return (
    <>
      {/* 폰: 한 명을 카드 하나로. 열 12개짜리 표를 가로로 밀어 보는 건 쓸 수 없었다 */}
      <div className="border-t border-ink xl:hidden">
        {!emptyMessage && (
          <div className="flex items-center gap-[10px] border-b border-line-strong px-1 py-[10px]">
            <SelectAllCheckbox
              checked={allSelected}
              disabled={!members?.length}
              onCheckedChange={onSelectAll}
              label="회원 전체 선택"
            />
            <span className="text-[13px] leading-[1.6] tracking-[-0.02em] text-ink-3">
              {allSelectedLabel}
              {selectedIds.length > 0 && ` · ${selectedIds.length}명 선택됨`}
            </span>
          </div>
        )}
        <MemberCardList
          members={members ?? []}
          selectedIds={selectedIds}
          onSelectOne={onSelectOne}
          onFieldChange={onFieldChange}
          onWithdraw={onWithdraw}
          canWithdraw={canWithdraw}
          emptyMessage={emptyMessage}
        />
      </div>

      {/* 태블릿 이상: 지금까지의 표 그대로 */}
      <div className="hidden overflow-x-auto border-t border-ink xl:block">
      <Table className="w-full min-w-[915px]">
        <TableHeader>
          <TableRow className="h-[46px] border-b border-ink-3 text-[16px] leading-[1.6] tracking-[-0.02em] text-ink-3">
            <TableHead className="w-[64px] text-center">
              <SelectAllCheckbox
                checked={allSelected}
                disabled={!members?.length}
                onCheckedChange={onSelectAll}
                label="회원 전체 선택"
              />
            </TableHead>
            <TableHead className="whitespace-nowrap text-center text-ink-3">ID</TableHead>
            <TableHead className="whitespace-nowrap text-center text-ink-3">이름</TableHead>
            <TableHead className="whitespace-nowrap text-center text-ink-3">전화번호</TableHead>
            <TableHead className="whitespace-nowrap text-center text-ink-3">학번</TableHead>
            <TableHead className="whitespace-nowrap text-center text-ink-3">Email</TableHead>
            <TableHead className="whitespace-nowrap text-center text-ink-3">재학상태</TableHead>
            <TableHead className="whitespace-nowrap text-center text-ink-3">권한</TableHead>
            <TableHead className="whitespace-nowrap text-center text-ink-3">게시글</TableHead>
            <TableHead className="whitespace-nowrap text-center text-ink-3">댓글</TableHead>
            <TableHead className="whitespace-nowrap text-center text-ink-3">정지 기간</TableHead>
            <TableHead className="whitespace-nowrap text-center text-ink-3">관리</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {emptyMessage ? (
            <TableRow className="h-[58px] text-[16px] leading-[1.6] tracking-[-0.02em] text-ink-2">
              <TableCell
                colSpan={COLUMN_COUNT}
                suppressHydrationWarning
                className="text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <MemberRow
                key={member.memberId}
                member={member}
                selected={selectedIds.includes(member.memberId)}
                onSelectChange={onSelectOne}
                onFieldChange={onFieldChange}
                onWithdraw={onWithdraw}
                canWithdraw={canWithdraw}
              />
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </>
  );
}
