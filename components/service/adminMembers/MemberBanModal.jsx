'use client';

import ReasonDialog from '@/components/common/ReasonDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMemberLabel } from '@/lib/utils';

/**
 * 관리자 - 선택한 회원을 영구 차단할 때 뜨는 확인 모달
 *
 * 목록에서 체크한 회원을 표로 다시 보여주고 확인만 받는다.
 * 영구 차단은 사유를 받지 않으므로(요청은 userIds 뿐) ReasonDialog의 hideReason으로 쓴다.
 * all-or-nothing 처리라 대상이 하나도 없으면 확인을 막는다.
 * 실제 처리(API 호출 · 목록 갱신)는 부모가 담당한다.
 */
export default function MemberBanModal({
  open,
  // [{ memberId, loginId, name, studentNo | studentNumber }]
  members = [],
  onClose,
  onSubmit,
}) {
  return (
    <ReasonDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      hideReason
      confirmLabel="영구 차단"
      // 대상이 하나도 없으면 차단할 것이 없으므로 확인을 막는다
      disabled={members.length === 0}
      // 폭은 표 내용에 따라 늘어난다. 짧으면 시안 크기(505px)를 지키고,
      // 대상 회원이 길면 그만큼 넓어지되 화면을 넘지 않도록 상한을 둔다.
      // min-width는 max-width보다 우선하므로 하한에도 92vw를 걸어야
      // 좁은 화면에서 모달이 화면 밖으로 잘려나가지 않는다.
      contentClassName="w-auto min-w-[min(505px,92vw)] max-w-[min(900px,92vw)]"
      title={
        <>
          선택된 회원을 <span className="font-extrabold">영구 차단</span> 하시겠습니까?
        </>
      }
      // 디자인에는 없지만 스크린리더 안내와 Radix 경고 방지를 위해 넣는다
      description={`선택한 회원 ${members.length}명을 영구 차단합니다.`}
    >
      {/* 위아래 진한 선은 표 바깥에 둔다.
          TableBody가 마지막 행의 아래선을 지워주므로, 마지막 행 밑에는 이 진한 선만 남는다. */}
      <div className="border-b border-t border-[#454545]">
        {/* table-fixed가 아니라 내용에 맞춰 열이 늘어나는 기본(auto) 레이아웃이다.
            앞 열은 시안 너비를 최소값으로만 잡아두고, 길어지면 그만큼 넓어진다. */}
        <Table>
          <TableHeader>
            <TableRow className="h-[32px] border-b border-[#454545] hover:bg-transparent">
              <TableHead className="min-w-[56px] px-0 text-center text-[12px] font-normal leading-[1.4] tracking-[-0.24px] text-[#919191]">
                번호
              </TableHead>
              <TableHead className="min-w-[200px] px-0 text-center text-[12px] font-normal leading-[1.4] tracking-[-0.24px] text-[#919191]">
                대상 회원
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {members.map((member, index) => (
              <TableRow
                key={member.memberId}
                className="h-[40px] border-b border-[#b9b9b9] hover:bg-transparent"
              >
                <TableCell className="px-0 pl-[18px] text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">
                  {index + 1}
                </TableCell>
                {/* 회원 정보가 길어져도 모달을 넘지 않도록 안쪽 span으로 상한을 걸고 말줄임한다.
                    auto 레이아웃에서는 td의 max-width가 먹지 않는다. */}
                <TableCell className="pl-0 pr-[16px] text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
                  <span className="block max-w-[280px] truncate">
                    {formatMemberLabel({
                      loginId: member.loginId,
                      studentId: member.studentNo ?? member.studentNumber,
                      name: member.name,
                    })}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ReasonDialog>
  );
}
