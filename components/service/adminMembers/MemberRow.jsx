'use client';

import { useState } from 'react';

import RowCheckbox from '@/components/shared/admin/RowCheckbox';
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


// 두 번 누르면 그 자리에서 고치는 칸.
// 한 번 누르는 걸로 열면 행을 고르려다 실수로 편집이 열려 성가시다 — 그래서 더블클릭이다.
// Enter 로 저장, Esc 로 되돌리기, 칸 밖을 눌러도 저장한다.
function EditableText({ label, value, onChange, placeholder = '-' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const open = () => {
    setDraft(value ?? '');
    setIsEditing(true);
  };

  const commit = () => {
    setIsEditing(false);
    const next = draft.trim();
    // 빈 값으로 지우는 건 실수일 때가 많아 되돌린다
    if (!next || next === (value ?? '')) return;
    onChange(next);
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onDoubleClick={open}
        title={`${label} 수정 (두 번 클릭)`}
        aria-label={`${label} 수정 (현재 ${value || '없음'})`}
        className="w-full rounded-[4px] px-1 text-center hover:bg-[#F5F5F5] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {value || placeholder}
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={draft}
      aria-label={`${label} 입력`}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setIsEditing(false);
      }}
      className="w-full min-w-0 rounded-[4px] border border-[#212121] bg-white px-2 py-[2px] text-center text-[16px] leading-[1.6] tracking-[-0.02em] text-[#212121] outline-none"
    />
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
        onDoubleClick={() => setIsEditing(true)}
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
  onWithdraw,
  canWithdraw = false,
}) {
  const isAdminRole = member.role !== MEMBER_ROLES.GENERAL;

  return (
    <TableRow className="h-[58px] border-b border-[#B9B9B9] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
      {/* 1. 선택 체크박스 */}
      <TableCell className="text-center">
        <RowCheckbox
          checked={selected}
          onCheckedChange={(checked) => onSelectChange?.(member.memberId, checked)}
          label={`${member.loginId} 회원 선택`}
        />
      </TableCell>

      {/* 2. 기본 정보 — 이름·전화번호·학번은 두 번 누르면 그 자리에서 고친다.
             ID 와 Email 은 서버가 수정 대상에서 빼 둔 값이라(로그인 열쇠·본인 확인 수단) 잠가 둔다 */}
      <TableCell className="whitespace-nowrap text-center" title="ID 는 수정할 수 없어요">
        {member.loginId}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        <EditableText
          label="이름"
          value={member.name}
          onChange={(next) => onFieldChange?.(member.memberId, 'name', next)}
        />
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        <EditableText
          label="전화번호"
          value={member.phone}
          onChange={(next) => onFieldChange?.(member.memberId, 'phone', next)}
        />
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        <EditableText
          label="학번"
          value={member.studentNumber}
          onChange={(next) => onFieldChange?.(member.memberId, 'studentNumber', next)}
        />
      </TableCell>
      <TableCell className="whitespace-nowrap text-center" title="Email 은 수정할 수 없어요">
        {member.email}
      </TableCell>

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

      {/* 7. 강제 탈퇴 — 관리 레벨 3만 사용 가능하고, 관리자 계정은 대상이 될 수 없다 */}
      <TableCell className="whitespace-nowrap text-center">
        <button
          type="button"
          disabled={!canWithdraw || isAdminRole}
          title={canWithdraw ? undefined : '관리 레벨 3만 사용할 수 있습니다.'}
          onClick={() => onWithdraw?.(member)}
          className="rounded-[4px] border border-[#B9B9B9] px-3 py-1 text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545] transition hover:border-[#212121] hover:text-[#212121] disabled:cursor-not-allowed disabled:border-[#E0E0E0] disabled:text-[#C4C4C4]"
        >
          탈퇴
        </button>
      </TableCell>
    </TableRow>
  );
}
