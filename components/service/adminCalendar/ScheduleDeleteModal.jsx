'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

// 일정 삭제 확인 모달
// isDeleting: 삭제 요청이 도는 동안 버튼과 바깥 클릭 닫기를 잠근다.
export default function ScheduleDeleteModal({ schedule, onConfirm, onCancel, isDeleting = false }) {
  // 닫을 때 schedule이 곧바로 null이 되는데, 모달은 닫힘 애니메이션(200ms) 동안 살아 있다.
  // 그 사이 제목이 사라져 '　일정을 삭제할까요?'가 보이므로 마지막 일정을 붙들어 둔다.
  const [shown, setShown] = React.useState(schedule);

  React.useEffect(() => {
    if (schedule) setShown(schedule);
  }, [schedule]);

  return (
    <Dialog open={Boolean(schedule)} onOpenChange={(next) => !next && !isDeleting && onCancel?.()}>
      <DialogContent
        hideCloseButton
        className="max-w-[320px] gap-[16px] rounded-[4px] border-[#dedede] p-[24px]"
      >
        <DialogTitle className="text-center text-[16px] font-semibold leading-[1.6] tracking-[-0.32px] text-[#212121] [word-break:keep-all]">
          {shown?.title} 일정을 삭제할까요?
        </DialogTitle>

        <DialogDescription className="text-center text-[14px] leading-[1.6] tracking-[-0.28px] text-[#757575] [word-break:keep-all]">
          삭제한 일정은 되돌릴 수 없습니다.
        </DialogDescription>

        <DialogFooter className="flex flex-row justify-center gap-[12px] sm:justify-center sm:space-x-0">
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-[48px] w-[87px] rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242] disabled:opacity-50"
          >
            삭제
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-[48px] w-[87px] rounded-[4px] border-[#b9b9b9] text-[16px] text-[#212121] disabled:opacity-50"
          >
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
