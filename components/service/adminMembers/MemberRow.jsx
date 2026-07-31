'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { MEMBER_ROLES } from '@/constants/adminMembers';
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

// member: memberId, loginId, name, phone, studentNumber, email,
//         enrollmentStatus, role, postCount, commentCount, suspendedPeriod
export default function MemberRow({ member, selected = false, onSelectChange }) {
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

      {/* 3. 재학상태 (외곽선 뱃지) */}
      <TableCell className="whitespace-nowrap text-center">
        <Pill>{member.enrollmentStatus}</Pill>
      </TableCell>

      {/* 4. 권한 (일반회원은 외곽선, 관리 Lv.N은 채움) */}
      <TableCell className="whitespace-nowrap text-center">
        <Pill filled={isAdminRole}>{member.role}</Pill>
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
