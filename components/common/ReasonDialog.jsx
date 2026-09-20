'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { REPORT_REASONS, REPORT_REASON_ETC, REPORT_DETAIL_MAX_LENGTH } from '@/constants/report';

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
  // 확인 처리 실패 메시지. 모달이 열려 있는 동안의 실패라 배경(Overlay)에 가려지지 않도록
  // 모달 안에서 보여준다.
  error,
  onClose,
  onSubmit,
}) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  // 사유 목록의 열림 상태. ESC를 눌렀을 때 목록만 닫기 위해 직접 들고 있는다.
  const [reasonOpen, setReasonOpen] = useState(false);
  const reasonRootRef = useRef(null);
  const selectedLabel = REPORT_REASONS.find((item) => item.code === reason)?.label ?? '';

  // 목록 바깥을 누르면 닫는다 (모달은 그대로)
  useEffect(() => {
    if (!reasonOpen) return undefined;
    const onPointerDown = (event) => {
      if (!reasonRootRef.current?.contains(event.target)) setReasonOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [reasonOpen]);

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
            {/* 직접 그린 드롭다운. Radix Select 는 목록을 열 때 뒤의 모달에 aria-hidden 을 붙이는데,
                포커스는 모달 안 버튼에 남아 있어 크롬이 접근성 경고를 19개씩 냈다.
                목록을 모달 안에 absolute 로 붙이면 숨길 것도, 경고도 없다 */}
            <div ref={reasonRootRef} className="relative">
              <button
                type="button"
                onClick={() => setReasonOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={reasonOpen}
                className={cn(
                  'flex h-[52px] w-full items-center justify-between rounded-[4px] border border-[#b9b9b9] bg-white px-3 text-left text-[16px] tracking-[-0.32px] shadow-none',
                  reason ? 'text-[#454545]' : 'text-[#b9b9b9]',
                  triggerClassName
                )}
              >
                <span className="truncate">{selectedLabel || '선택'}</span>
                <ChevronDown size={18} className="shrink-0 text-[#919191]" aria-hidden />
              </button>

              {reasonOpen && (
                <ul
                  role="listbox"
                  aria-label="사유"
                  className="absolute left-0 right-0 top-[56px] z-20 max-h-[240px] overflow-y-auto rounded-[4px] border border-[#dedede] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
                >
                  {REPORT_REASONS.map(({ code, label }) => (
                    <li key={code} role="option" aria-selected={reason === code}>
                      <button
                        type="button"
                        onClick={() => {
                          setReason(code);
                          setReasonOpen(false);
                        }}
                        // #183 모바일: 항목 사이 구분선(#B9B9B9)·텍스트 #9E9E9E·행 높이 52px(피그마). 데스크톱(md↑)은 기존 그대로
                        className={cn(
                          'block w-full border-b border-[#B9B9B9] px-3 py-[13px] text-left text-[16px] text-[#9E9E9E] last:border-b-0 hover:bg-[#dedede] md:border-b-0 md:py-1.5 md:text-[#454545]',
                          reason === code && 'bg-[#f0f0f0] text-[#212121]'
                        )}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
        {/* #183 모바일 기본 신고 모달 높이를 피그마(371px)에 맞추는 여백.
            기타 선택 시엔 상세 사유 입력칸이 그 자리를 채우므로 넣지 않는다. */}
        {!hideReason && !isEtc && <div aria-hidden className="h-[6px] md:hidden" />}

        {error && (
          <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#e02d2d]">{error}</p>
        )}

        {/* #183 모바일은 버튼 가운데 정렬(피그마), 데스크톱(md↑)은 기존 오른쪽 정렬 유지 */}
        <DialogFooter className="flex flex-row justify-center gap-[12px] sm:space-x-0 md:justify-end">
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
