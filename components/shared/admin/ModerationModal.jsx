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

// 표에 보여줄 제목 · 댓글 내용의 최대 글자 수. 넘으면 뒤를 ...으로 줄인다.
// 공백도 한 글자로 센다.
const CONTENT_MAX_LENGTH = 12;

// 이모지처럼 서로게이트 페어로 저장되는 문자도 한 글자로 세도록 배열로 풀어서 자른다.
// (ZWJ로 이어붙인 이모지는 여전히 여러 자로 세지만 제목 · 댓글에는 거의 쓰이지 않아 그냥 둔다)
const truncateContent = (text) => {
  const characters = [...(text ?? '')];
  if (characters.length <= CONTENT_MAX_LENGTH) return characters.join('');
  return `${characters.slice(0, CONTENT_MAX_LENGTH).join('')}...`;
};

/**
 * 관리자 - 선택한 게시글 · 댓글에 조치를 취할 때 뜨는 모달 (블라인드 등)
 *
 * 목록에서 체크한 항목을 표로 다시 보여주고 사유를 받는다.
 * 사유 선택 · 기타 상세 사유 · 취소/확인은 신고 모달과 같아서 ReasonDialog가 담당한다.
 * 실제 처리(API 호출 · 목록 갱신)는 부모가 담당한다.
 */
export default function ModerationModal({
  open,
  // 제목에서 굵게 보여줄 조치 이름 (예: 블라인드)
  actionLabel = '블라인드',
  // '게시글' | '댓글' - 제목과 표의 마지막 열 이름에 함께 쓴다
  targetLabel = '게시글',
  // [{ id, user: { loginId, studentId, name }, boardName, content }]
  // content는 게시판 이름을 뺀 제목 · 댓글 내용만 넘긴다 ([게시판명]은 여기서 붙인다).
  // 12자 말줄임을 게시판 이름까지 포함해서 세면 안 되기 때문이다.
  items = [],
  onClose,
  onSubmit,
}) {
  return (
    <ReasonDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      // 대상이 하나도 없으면 조치할 것이 없으므로 확인을 막는다
      disabled={items.length === 0}
      // 폭은 표 내용에 따라 늘어난다. 짧으면 시안 크기(505px)를 지키고,
      // 대상 회원 · 게시글이 길면 그만큼 넓어지되 화면을 넘지 않도록 상한을 둔다.
      // min-width는 max-width보다 우선하므로 하한에도 92vw를 걸어야
      // 좁은 화면에서 모달이 화면 밖으로 잘려나가지 않는다.
      contentClassName="w-auto min-w-[min(505px,92vw)] max-w-[min(900px,92vw)]"
      triggerClassName="w-[296px]"
      title={
        <>
          선택된 {targetLabel}을 <span className="font-extrabold">{actionLabel}</span> 처리
          하시겠습니까?
        </>
      }
      // 디자인에는 없지만 스크린리더 안내와 Radix 경고 방지를 위해 넣는다
      description={`선택한 ${targetLabel} ${items.length}건의 ${actionLabel} 사유를 고릅니다.`}
    >
      {/* 위아래 진한 선은 표 바깥에 둔다.
          TableBody가 마지막 행의 아래선을 지워주므로, 마지막 행 밑에는 이 진한 선만 남는다. */}
      <div className="border-b border-t border-[#454545]">
        {/* table-fixed가 아니라 내용에 맞춰 열이 늘어나는 기본(auto) 레이아웃이다.
            앞 두 열은 시안 너비를 최소값으로만 잡아두고, 길어지면 그만큼 넓어진다. */}
        <Table>
          <TableHeader>
            <TableRow className="h-[32px] border-b border-[#454545] hover:bg-transparent">
              <TableHead className="min-w-[56px] px-0 text-center text-[12px] font-normal leading-[1.4] tracking-[-0.24px] text-[#919191]">
                번호
              </TableHead>
              <TableHead className="min-w-[200px] px-0 text-center text-[12px] font-normal leading-[1.4] tracking-[-0.24px] text-[#919191]">
                대상 회원
              </TableHead>
              <TableHead className="min-w-[199px] px-0 text-center text-[12px] font-normal leading-[1.4] tracking-[-0.24px] text-[#919191]">
                대상 {targetLabel}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((item, index) => (
              <TableRow
                key={item.id}
                className="h-[40px] border-b border-[#b9b9b9] hover:bg-transparent"
              >
                <TableCell className="px-0 pl-[18px] text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">
                  {index + 1}
                </TableCell>
                {/* 회원 정보가 길어져도 오른쪽 열 내용과 붙지 않도록 최소 16px을 띄운다.
                    auto 레이아웃에서는 td의 max-width가 먹지 않아 안쪽 span으로 상한을 건다. */}
                <TableCell className="pl-0 pr-[16px] text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
                  <span className="block max-w-[280px] truncate">
                    {formatMemberLabel(item.user)}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap px-0 text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
                  {item.boardName && `[${item.boardName}] `}
                  {truncateContent(item.content)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ReasonDialog>
  );
}
