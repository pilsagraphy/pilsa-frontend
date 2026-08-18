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

// 체크박스 열까지 포함한 전체 열 개수 (빈 목록 안내문 가로 병합에 사용)
const COLUMN_COUNT = 11;

export default function MemberTable({
  members,
  selectedIds = [],
  onSelectOne,
  onSelectAll,
  onFieldChange,
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

  return (
    <div className="overflow-x-auto border-t border-[#212121]">
      {/* 열이 11개라 좁은 화면에서는 가로 스크롤로 처리한다. */}
      <Table className="w-full min-w-[915px]">
        <TableHeader>
          <TableRow className="h-[46px] border-b border-[#919191] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
            <TableHead className="w-[64px] text-center">
              <SelectAllCheckbox
                checked={allSelected}
                disabled={!members?.length}
                onCheckedChange={onSelectAll}
                label="회원 전체 선택"
              />
            </TableHead>
            <TableHead className="whitespace-nowrap text-center text-[#919191]">ID</TableHead>
            <TableHead className="whitespace-nowrap text-center text-[#919191]">이름</TableHead>
            <TableHead className="whitespace-nowrap text-center text-[#919191]">전화번호</TableHead>
            <TableHead className="whitespace-nowrap text-center text-[#919191]">학번</TableHead>
            <TableHead className="whitespace-nowrap text-center text-[#919191]">Email</TableHead>
            <TableHead className="whitespace-nowrap text-center text-[#919191]">재학상태</TableHead>
            <TableHead className="whitespace-nowrap text-center text-[#919191]">권한</TableHead>
            <TableHead className="whitespace-nowrap text-center text-[#919191]">게시글</TableHead>
            <TableHead className="whitespace-nowrap text-center text-[#919191]">댓글</TableHead>
            <TableHead className="whitespace-nowrap text-center text-[#919191]">정지 기간</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {emptyMessage ? (
            <TableRow className="h-[58px] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
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
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
