'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  REPORT_REASONS,
  REPORT_REASON_ETC,
  REPORT_DETAIL_MAX_LENGTH,
} from '@/constants/report';

/**
 * 게시글/댓글 신고 모달
 * onSubmit으로 { reason, detail }을 넘겨주고, 실제 전송은 부모가 처리한다.
 */
export default function ReportModal({
  open,
  onClose,
  onSubmit,
  targetLabel = '댓글',
  // { loginId, studentId, name } - 서버가 주지 않는 값은 자동으로 생략된다
  targetUser = null,
  targetContent = '',
}) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  // 사유 목록의 열림 상태. ESC를 눌렀을 때 목록만 닫기 위해 직접 들고 있는다.
  const [reasonOpen, setReasonOpen] = useState(false);

  // 디자인 형식: 로그인ID / 학번 / 이름
  const targetUserText = [targetUser?.loginId, targetUser?.studentId, targetUser?.name]
    .filter(Boolean)
    .join(' / ');

  // 열릴 때마다 입력값 초기화
  useEffect(() => {
    if (!open) return;
    setReason('');
    setDetail('');
    setReasonOpen(false);
  }, [open]);

  const isEtc = reason === REPORT_REASON_ETC;
  // 기타를 선택했으면 상세 사유까지 입력해야 신고할 수 있다
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
        // 기타 선택 시 상세 사유 입력란이 늘어나므로, 짧은 화면에서는 모달 내부를 스크롤한다
        className="max-h-[90vh] max-w-[346px] gap-[16px] overflow-y-auto rounded-[4px] border-[#212121] p-[25px]"
      >
        <DialogTitle className="text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
          해당 {targetLabel}을 <span className="font-extrabold">신고</span> 하시겠습니까?
        </DialogTitle>

        {targetUserText && (
          <div className="flex flex-col gap-[4px]">
            <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">
              대상 회원
            </span>
            <span className="break-all text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
              {targetUserText}
            </span>
          </div>
        )}

        {targetContent && (
          <div className="flex flex-col gap-[4px]">
            <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">
              대상 게시글
            </span>
            <span className="line-clamp-2 break-words text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
              {targetContent}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">사유</span>
          <Select
            open={reasonOpen}
            onOpenChange={setReasonOpen}
            value={reason}
            onValueChange={setReason}
          >
            <SelectTrigger className="h-[52px] rounded-[4px] border-[#b9b9b9] text-[16px] tracking-[-0.32px] text-[#454545] shadow-none data-[placeholder]:text-[#b9b9b9]">
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
