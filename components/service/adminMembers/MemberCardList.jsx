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
import {
  ENROLLMENT_STATUSES,
  MEMBER_ROLE_OPTIONS,
  MEMBER_ROLES,
} from '@/constants/adminMembers';

// 좁은 화면의 회원 목록.
//
// 표는 열이 12개라 가로 915px 이 필요했다. 폰에서는 좌우로 밀어야 겨우 한 칸씩 보였고,
// 어느 줄을 보고 있는지도 금방 잃어버렸다. 그래서 폰에서는 한 명을 카드 하나로 세워서 보여 준다.
// 자주 보는 값(이름·ID·권한·정지)은 접기 전에, 나머지(전화·학번·메일·활동 수)는 [자세히]로 접어 둔다.
//
// 고치는 방법은 표와 같다 — 값을 두 번 누르면 그 자리에서 바뀐다.
// (폰에는 더블클릭이 없어 한 번 눌러도 열리게 둔다. 표에서 더블클릭을 요구한 건 실수로 열리는 걸 막으려는 것인데,
//  카드에는 행 선택이 따로 있어 그럴 일이 없다)

function Pill({ filled = false, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-[13px] border px-2 py-[1px] text-[13px] leading-[1.5] tracking-[-0.02em] ${
        filled ? 'border-transparent bg-[#454545] text-white' : 'border-[#454545] text-[#454545]'
      }`}
    >
      {children}
    </span>
  );
}

function EditablePill({ label, value, options, filled = false, onChange }) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        aria-label={`${label} 변경 (현재 ${value})`}
        className="rounded-[13px]"
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
        className={`h-auto w-fit justify-center rounded-[13px] border px-2 py-0 text-[13px] leading-[1.5] shadow-none [&>svg]:hidden ${
          filled ? 'border-transparent bg-[#454545] text-white' : 'border-[#454545] text-[#454545]'
        }`}
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

function EditableText({ label, value, onChange, className = '' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const commit = () => {
    setIsEditing(false);
    const next = draft.trim();
    if (!next || next === (value ?? '')) return;
    onChange(next);
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? '');
          setIsEditing(true);
        }}
        aria-label={`${label} 수정 (현재 ${value || '없음'})`}
        className={`rounded-[4px] px-1 text-left hover:bg-[#F5F5F5] ${className}`}
      >
        {value || '-'}
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
      className="w-full min-w-0 rounded-[4px] border border-[#212121] bg-white px-2 py-[2px] text-[14px] leading-[1.6] text-[#212121] outline-none"
    />
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-[3px]">
      <span className="shrink-0 text-[12px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-right text-[14px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
        {children}
      </span>
    </div>
  );
}

function MemberCard({ member, selected, onSelectChange, onFieldChange, onWithdraw, canWithdraw }) {
  const [open, setOpen] = useState(false);
  const isAdminRole = member.role !== MEMBER_ROLES.GENERAL;

  const change = (field) => (next) => onFieldChange?.(member.memberId, field, next);

  return (
    <div className="border-b border-[#B9B9B9] px-1 py-[14px]">
      {/* 첫 줄: 선택 · 이름 · ID */}
      <div className="flex items-start gap-[10px]">
        <span className="pt-[3px]">
          <RowCheckbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange?.(member.memberId, checked)}
            label={`${member.loginId} 회원 선택`}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[6px]">
            <EditableText
              label="이름"
              value={member.name}
              onChange={change('name')}
              className="text-[16px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121]"
            />
            <span className="min-w-0 truncate text-[13px] leading-[1.6] text-[#919191]">
              {member.loginId}
            </span>
          </div>

          <div className="mt-[6px] flex flex-wrap items-center gap-[6px]">
            <EditablePill
              label="재학상태"
              value={member.enrollmentStatus}
              options={ENROLLMENT_STATUSES}
              onChange={change('enrollmentStatus')}
            />
            <EditablePill
              label="권한"
              value={member.role}
              options={MEMBER_ROLE_OPTIONS}
              filled={isAdminRole}
              onChange={change('role')}
            />
            {/* 정지 기간은 있을 때만 — 없는 사람에게 '-' 를 보여 줄 이유가 없다 */}
            {member.suspendedPeriod && (
              <span className="rounded-[13px] bg-[#FDECEC] px-2 py-[1px] text-[13px] leading-[1.5] text-[#C62828]">
                {member.suspendedPeriod}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="shrink-0 rounded-[4px] border border-[#B9B9B9] px-[10px] py-[3px] text-[13px] leading-[1.6] text-[#454545]"
        >
          {open ? '접기' : '자세히'}
        </button>
      </div>

      {open && (
        <div className="mt-[10px] rounded-[6px] bg-[#FAFAFA] px-[12px] py-[8px]">
          <DetailRow label="전화번호">
            <EditableText label="전화번호" value={member.phone} onChange={change('phone')} />
          </DetailRow>
          <DetailRow label="학번">
            <EditableText
              label="학번"
              value={member.studentNumber}
              onChange={change('studentNumber')}
            />
          </DetailRow>
          <DetailRow label="Email">{member.email}</DetailRow>
          <DetailRow label="게시글 · 댓글">
            {(member.postCount ?? 0).toLocaleString()} · {(member.commentCount ?? 0).toLocaleString()}
          </DetailRow>

          <button
            type="button"
            disabled={!canWithdraw || isAdminRole}
            title={canWithdraw ? undefined : '관리 레벨 3만 사용할 수 있습니다.'}
            onClick={() => onWithdraw?.(member)}
            className="mt-[8px] w-full rounded-[4px] border border-[#B9B9B9] py-[6px] text-[14px] leading-[1.6] text-[#454545] disabled:border-[#E0E0E0] disabled:text-[#C4C4C4]"
          >
            강제 탈퇴
          </button>
        </div>
      )}
    </div>
  );
}

export default function MemberCardList({
  members,
  selectedIds = [],
  onSelectOne,
  onFieldChange,
  onWithdraw,
  canWithdraw = false,
  emptyMessage = '',
}) {
  if (emptyMessage) {
    return (
      <p
        suppressHydrationWarning
        className="border-b border-[#B9B9B9] py-10 text-center text-[14px] text-[#919191]"
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {members.map((member) => (
        <MemberCard
          key={member.memberId}
          member={member}
          selected={selectedIds.includes(member.memberId)}
          onSelectChange={onSelectOne}
          onFieldChange={onFieldChange}
          onWithdraw={onWithdraw}
          canWithdraw={canWithdraw}
        />
      ))}
    </div>
  );
}
