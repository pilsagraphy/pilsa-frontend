'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';

/**
 * 네/아니오 확인 모달
 * window.confirm을 대체한다. 확인/취소 후 처리는 부모가 담당.
 */
export default function ConfirmModal({
  open,
  title,
  confirmText = '네',
  cancelText = '아니오',
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel?.()}>
      <DialogContent
        hideCloseButton
        className="max-w-[300px] gap-[24px] rounded-[4px] border-[#dedede] p-[24px]"
      >
        <DialogTitle className="text-center text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
          {title}
        </DialogTitle>

        <DialogFooter className="flex flex-row justify-center gap-[12px] sm:justify-center sm:space-x-0">
          <Button
            type="button"
            onClick={onConfirm}
            className="h-[48px] w-[87px] rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242]"
          >
            {confirmText}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-[48px] w-[87px] rounded-[4px] border-[#b9b9b9] text-[16px] text-[#212121]"
          >
            {cancelText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
