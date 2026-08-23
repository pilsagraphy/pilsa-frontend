'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

// 일정 삭제 확인 모달
export default function ScheduleDeleteModal({ schedule, onConfirm, onCancel }) {
  return (
    <Dialog open={Boolean(schedule)} onOpenChange={(next) => !next && onCancel?.()}>
      <DialogContent
        hideCloseButton
        className="max-w-[320px] gap-[16px] rounded-[4px] border-[#dedede] p-[24px]"
      >
        <DialogTitle className="text-center text-[16px] font-semibold leading-[1.6] tracking-[-0.32px] text-[#212121] [word-break:keep-all]">
          {schedule?.title} 일정을 삭제할까요?
        </DialogTitle>

        <DialogDescription className="text-center text-[14px] leading-[1.6] tracking-[-0.28px] text-[#757575] [word-break:keep-all]">
          삭제한 일정은 되돌릴 수 없습니다.
        </DialogDescription>

        <DialogFooter className="flex flex-row justify-center gap-[12px] sm:justify-center sm:space-x-0">
          <Button
            type="button"
            onClick={onConfirm}
            className="h-[48px] w-[87px] rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242]"
          >
            삭제
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-[48px] w-[87px] rounded-[4px] border-[#b9b9b9] text-[16px] text-[#212121]"
          >
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
