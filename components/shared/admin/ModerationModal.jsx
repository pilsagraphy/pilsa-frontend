'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  REPORT_REASONS,
  REPORT_REASON_ETC,
  REPORT_DETAIL_MAX_LENGTH,
} from '@/constants/report';

/**
 * 관리자 - 선택한 게시글 · 댓글에 조치를 취할 때 뜨는 모달 (블라인드 등)
 *
 * 목록에서 체크한 항목을 표로 다시 보여주고 사유를 받는다.
 * 사유 목록은 사용자 신고 사유와 1:1로 같아서 constants/report.js를 그대로 쓴다.
 * 실제 처리(API 호출 · 목록 갱신)는 부모가 담당한다.
 */
export default function ModerationModal({
  open,
  // 제목에서 굵게 보여줄 조치 이름 (예: 블라인드)
  actionLabel = '블라인드',
  // '게시글' | '댓글' - 제목과 표의 마지막 열 이름에 함께 쓴다
  targetLabel = '게시글',
  // [{ id, user, content }] - user는 '로그인ID / 학번 / 이름' 형식의 문자열
  items = [],
  onClose,
  onSubmit,
}) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  // 사유 목록의 열림 상태. ESC를 눌렀을 때 목록만 닫기 위해 직접 들고 있는다.
  const [reasonOpen, setReasonOpen] = useState(false);

  // 열릴 때마다 입력값 초기화
  useEffect(() => {
    if (!open) return;
    setReason('');
    setDetail('');
    setReasonOpen(false);
  }, [open]);

  const isEtc = reason === REPORT_REASON_ETC;
  // 기타를 선택했으면 상세 사유까지 입력해야 처리할 수 있다
  const canSubmit = Boolean(reason) && (!isEtc || detail.trim().length > 0);

  const handleConfirm = () => {
    if (!canSubmit) return;
    onSubmit?.({ reason, detail: isEtc ? detail.trim() : '' });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent
        hideCloseButton
        // 사유 목록이 열려 있을 때의 ESC는 목록만 닫는다.
        // 모달까지 같이 닫히면 body에 pointer-events: none이 남아 화면 전체가 클릭되지 않는다.
        onEscapeKeyDown={(event) => {
          if (!reasonOpen) return;
          event.preventDefault();
          setReasonOpen(false);
        }}
        // 선택 건수가 많거나 기타 선택 시 상세 사유가 붙으면 길어지므로 모달 내부를 스크롤한다
        className="max-h-[90vh] max-w-[505px] gap-[16px] overflow-y-auto rounded-[4px] border-[#212121] p-[25px]"
      >
        <DialogTitle className="text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
          선택된 {targetLabel}을 <span className="font-extrabold">{actionLabel}</span> 처리
          하시겠습니까?
        </DialogTitle>

        {/* 디자인에는 없지만 스크린리더 안내와 Radix 경고 방지를 위해 넣는다 */}
        <DialogDescription className="sr-only">
          선택한 {targetLabel} {items.length}건의 {actionLabel} 사유를 고릅니다.
        </DialogDescription>

        {/* 위아래 진한 선은 표 바깥에 둔다.
            TableBody가 마지막 행의 아래선을 지워주므로, 마지막 행 밑에는 이 진한 선만 남는다. */}
        <div className="border-b border-t border-[#454545]">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="h-[32px] border-b border-[#454545] hover:bg-transparent">
                <TableHead className="w-[56px] px-0 text-center text-[12px] font-normal leading-[1.4] tracking-[-0.24px] text-[#919191]">
                  번호
                </TableHead>
                <TableHead className="w-[200px] px-0 text-center text-[12px] font-normal leading-[1.4] tracking-[-0.24px] text-[#919191]">
                  대상 회원
                </TableHead>
                <TableHead className="px-0 text-center text-[12px] font-normal leading-[1.4] tracking-[-0.24px] text-[#919191]">
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
                  <TableCell className="truncate px-0 text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
                    {item.user}
                  </TableCell>
                  <TableCell className="truncate px-0 text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
                    {item.content}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">사유</span>
          <Select
            open={reasonOpen}
            onOpenChange={setReasonOpen}
            value={reason}
            onValueChange={setReason}
          >
            <SelectTrigger className="h-[52px] w-[296px] rounded-[4px] border-[#b9b9b9] text-[16px] tracking-[-0.32px] text-[#454545] shadow-none data-[placeholder]:text-[#b9b9b9]">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            {/*
              side="bottom": 아래로 펼치는 것을 기본으로 한다.
              max-h: 화면에 남은 높이(--radix-select-content-available-height)를 넘지 않게 제한해
              목록이 화면을 벗어나지 않고 내부 스크롤되도록 한다.
            */}
            <SelectContent
              side="bottom"
              sideOffset={4}
              className="max-h-[min(240px,var(--radix-select-content-available-height))]"
            >
              {REPORT_REASONS.map(({ code, label }) => (
                <SelectItem
                  key={code}
                  value={code}
                  // 기본 hover 색은 Radix가 항목에 포커스를 줄 때(data-highlighted)만 켜지는데,
                  // 모달(Dialog) 안에서는 포커스가 트리거에 묶여 있어 마우스를 올려도 아무 색이 안 뜬다.
                  // 그래서 포커스와 무관한 :hover로 직접 회색을 준다. (키보드 이동용으로 highlighted도 함께 둔다)
                  className="cursor-pointer text-[16px] text-[#454545] hover:bg-[#dedede] data-[highlighted]:bg-[#dedede]"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 기타 선택 시에만 상세 사유 입력 */}
        {isEtc && (
          <Textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="상세 사유를 입력하세요"
            maxLength={REPORT_DETAIL_MAX_LENGTH}
            className="h-[190px] resize-none rounded-[4px] border-[#b9b9b9] p-[16px] text-[16px] tracking-[-0.32px] shadow-none placeholder:text-[#b9b9b9]"
          />
        )}

        <DialogFooter className="flex flex-row justify-end gap-[12px] sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-[48px] w-[87px] rounded-[4px] border-[#b9b9b9] text-[16px] text-[#212121]"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="h-[48px] w-[87px] rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242]"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
