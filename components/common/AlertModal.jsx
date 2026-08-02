'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * 닫기 버튼만 있는 안내 모달
 * description에 줄바꿈(\n)을 넣으면 그대로 표시된다.
 */
export default function AlertModal({ open, title, description, closeText = '닫기', onClose }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent
        hideCloseButton
        className="max-w-[340px] gap-[20px] rounded-[4px] border-[#dedede] p-[24px]"
      >
        <DialogTitle className="text-center text-[16px] font-semibold leading-[1.6] tracking-[-0.32px] text-[#212121]">
          {title}
        </DialogTitle>

        {description && (
          <DialogDescription className="whitespace-pre-line text-center text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
            {description}
          </DialogDescription>
        )}

        <DialogFooter className="flex flex-row justify-center sm:justify-center sm:space-x-0">
          <Button
            type="button"
            onClick={onClose}
            className="h-[48px] w-[87px] rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242]"
          >
            {closeText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
