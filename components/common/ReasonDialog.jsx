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
import { cn } from '@/lib/utils';
import {
  REPORT_REASONS,
  REPORT_REASON_ETC,
  REPORT_DETAIL_MAX_LENGTH,
} from '@/constants/report';

/**
 * 사유를 골라서 확인하는 모달의 공통 껍데기 (신고 · 관리자 조치)
 *
 * 제목과 본문만 다르고 사유 선택 · 기타 상세 사유 · 취소/확인 버튼은 모두 같다.
 * 신고 사유와 조치 사유는 라벨까지 1:1로 같아 constants/report.js를 그대로 쓴다.
 * 고른 값은 onSubmit({ reason, detail })으로 넘기고 실제 처리는 부모가 담당한다.
 *
 * hideReason을 주면 사유 없이 확인만 받는 모달로도 쓸 수 있다.
 * (신고 관리의 '복원'처럼 시안에 사유 입력이 없는 경우)
 */
export default function ReasonDialog({
  open,
  // 제목. 굵은 글씨를 섞어야 해서 문자열이 아니라 노드로 받는다
  title,
  // 디자인에는 없는 스크린리더 안내. 주면 Radix의 aria-describedby 경고도 함께 사라진다
  description,
  // 제목과 '사유' 사이에 들어갈 내용 (대상 회원 · 대상 목록 표 등)
  children,
  // 모달 · 사유 트리거의 크기를 호출부에서 조절한다
  contentClassName,
  triggerClassName,
  // 확인 버튼 글자. 시안에서 '복원' · '삭제'처럼 조치 이름을 쓰는 경우가 있다
  confirmLabel = '확인',
  // 사유 입력 자체를 없앤다 (사유 없이 확인만 받는 모달)
  hideReason = false,
  // 사유와 별개로 확인을 막아야 할 때 (예: 대상이 하나도 없을 때)
  disabled = false,
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

  const isEtc = !hideReason && reason === REPORT_REASON_ETC;
  // 기타를 선택했으면 상세 사유까지 입력해야 확인할 수 있다
  // (사유를 받지 않는 모달은 대상만 있으면 바로 확인할 수 있다)
  const canSubmit =
    !disabled && (hideReason || (Boolean(reason) && (!isEtc || detail.trim().length > 0)));

  const handleConfirm = () => {
    if (!canSubmit) return;
    onSubmit?.({ reason: hideReason ? '' : reason, detail: isEtc ? detail.trim() : '' });
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
        className={cn(
          'max-h-[90vh] gap-[16px] overflow-y-auto rounded-[4px] border-[#212121] p-[25px]',
          contentClassName
        )}
      >
        <DialogTitle className="text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
          {title}
        </DialogTitle>

        {description && <DialogDescription className="sr-only">{description}</DialogDescription>}

        {children}

        {!hideReason && (
          <div className="flex flex-col gap-[4px]">
            <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">
              사유
            </span>
            <Select
              open={reasonOpen}
              onOpenChange={setReasonOpen}
              value={reason}
              onValueChange={setReason}
            >
              <SelectTrigger
                className={cn(
                  'h-[52px] rounded-[4px] border-[#b9b9b9] text-[16px] tracking-[-0.32px] text-[#454545] shadow-none data-[placeholder]:text-[#b9b9b9]',
                  triggerClassName
                )}
              >
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
        )}

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
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
