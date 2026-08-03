'use client';

import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  ENROLLMENT_STATUSES,
  MEMBER_ROLE_OPTIONS,
  MEMBER_ROLES,
} from '@/constants/adminMembers';
import { cn } from '@/lib/utils';

// 재학상태 · 권한에 쓰이는 알약(pill) 뱃지
// 채움/외곽선 두 종류의 높이를 맞추려고 채움 쪽에도 투명 border를 준다.
function Pill({ filled = false, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[13px] border px-2 text-[16px] leading-[1.6] tracking-[-0.02em]',
        filled
          ? 'border-transparent bg-[#454545] text-white'
          : 'border-[#454545] text-[#454545]'
      )}
    >
      {children}
    </span>
  );
}

// 평소에는 뱃지로 보이다가, 누르면 그 자리에 select가 열리는 셀.
// 값을 고르거나 바깥을 클릭하면 다시 뱃지로 돌아간다.
function EditablePill({ label, value, options, filled = false, onChange }) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        aria-label={`${label} 변경 (현재 ${value})`}
        className="rounded-[13px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Pill filled={filled}>{value}</Pill>
      </button>
    );
  }

  return (
    <Select
      defaultOpen
      value={value}
      onValueChange={(next) => {
        onChange(next);
        setIsEditing(false);
      }}
      onOpenChange={(open) => {
        if (!open) setIsEditing(false);
      }}
    >
      <SelectTrigger
        aria-label={`${label} 선택`}
        className={cn(
          // 평소 Pill과 같은 모양으로 맞춰 편집 진입 시 튀지 않게 한다. (화살표 아이콘은 숨김)
          'mx-auto h-auto w-fit justify-center rounded-[13px] border px-2 py-0 text-[16px] leading-[1.6] tracking-[-0.02em] shadow-none [&>svg]:hidden',
          filled
            ? 'border-transparent bg-[#454545] text-white'
            : 'border-[#454545] text-[#454545]'
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// member: memberId, loginId, name, phone, studentNumber, email,
//         enrollmentStatus, role, postCount, commentCount, suspendedPeriod
export default function MemberRow({
  member,
  selected = false,
  onSelectChange,
  onFieldChange,
}) {
  const isAdminRole = member.role !== MEMBER_ROLES.GENERAL;

  return (
    <TableRow className="h-[58px] border-b border-[#B9B9B9] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
      {/* 1. 선택 체크박스 */}
      <TableCell className="text-center">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelectChange?.(member.memberId, checked === true)}
          aria-label={`${member.loginId} 회원 선택`}
          className="size-6 rounded-[4px] border-[#919191] data-[state=checked]:border-[#212121] data-[state=checked]:bg-[#212121]"
        />
      </TableCell>

      {/* 2. 기본 정보 */}
      <TableCell className="whitespace-nowrap text-center">{member.loginId}</TableCell>
      <TableCell className="whitespace-nowrap text-center">{member.name}</TableCell>
      <TableCell className="whitespace-nowrap text-center">{member.phone}</TableCell>
      <TableCell className="whitespace-nowrap text-center">{member.studentNumber}</TableCell>
      <TableCell className="whitespace-nowrap text-center">{member.email}</TableCell>

      {/* 3. 재학상태 (누르면 select로 변경) */}
      <TableCell className="whitespace-nowrap text-center">
        <EditablePill
          label="재학상태"
          value={member.enrollmentStatus}
          options={ENROLLMENT_STATUSES}
          onChange={(next) => onFieldChange?.(member.memberId, 'enrollmentStatus', next)}
        />
      </TableCell>

      {/* 4. 권한 (일반회원은 외곽선, 관리 Lv.N은 채움 / 누르면 select로 변경) */}
      <TableCell className="whitespace-nowrap text-center">
        <EditablePill
          label="권한"
          value={member.role}
          options={MEMBER_ROLE_OPTIONS}
          filled={isAdminRole}
          onChange={(next) => onFieldChange?.(member.memberId, 'role', next)}
        />
      </TableCell>

      {/* 5. 활동 수치 */}
      <TableCell className="whitespace-nowrap text-center">
        {member.postCount?.toLocaleString() ?? 0}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {member.commentCount?.toLocaleString() ?? 0}
      </TableCell>

      {/* 6. 정지 기간 (없으면 '-') */}
      <TableCell className="whitespace-nowrap text-center text-[#212121]">
        {member.suspendedPeriod || '-'}
      </TableCell>
    </TableRow>
  );
}
