'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useMinWidthMd } from '@/lib/useMinWidthMd';

/**
 * 네/아니오 확인 모달
 * window.confirm을 대체한다. 확인/취소 후 처리는 부모가 담당.
 *
 * #183 모바일 리디자인: 모바일은 피그마(다크 테두리·#454545 텍스트·컴팩트),
 * 데스크톱(md↑)은 기존 스타일 그대로. 취소 라벨 기본값도 모바일 '아니요' / 데스크톱 '아니오'.
 * (confirmText/cancelText 를 넘기면 그 값을 두 화면 모두 그대로 쓴다)
 */
export default function ConfirmModal({
  open,
  title,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) {
  const isMdUp = useMinWidthMd();
  const confirmLabel = confirmText ?? '네';
  const cancelLabel = cancelText ?? (isMdUp ? '아니오' : '아니요');

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel?.()}>
      <DialogContent
        hideCloseButton
        className="max-w-[271px] gap-[12px] rounded-[4px] border-[#212121] px-[16px] py-[24px] md:max-w-[300px] md:gap-[24px] md:border-[#dedede] md:p-[24px]"
      >
        <DialogTitle className="text-center text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#454545] md:text-[#212121]">
          {title}
        </DialogTitle>

        <DialogFooter className="flex flex-row justify-center gap-[12px] sm:justify-center sm:space-x-0">
          <Button
            type="button"
            onClick={onConfirm}
            className="h-[48px] w-[87px] rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242]"
          >
            {confirmLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-[48px] w-[87px] rounded-[4px] border-[#b9b9b9] text-[16px] text-[#212121]"
          >
            {cancelLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
