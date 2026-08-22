'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

// 회원 강제 탈퇴 확인 모달
// 되돌릴 수 없는 처리라 공용 ConfirmModal 대신 경고 문구를 따로 둔다
export default function MemberWithdrawModal({ member, onConfirm, onCancel }) {
  return (
    <Dialog open={Boolean(member)} onOpenChange={(next) => !next && onCancel?.()}>
      <DialogContent
        hideCloseButton
        className="max-w-[320px] gap-[16px] rounded-[4px] border-[#dedede] p-[24px]"
      >
        <DialogTitle className="text-center text-[16px] font-semibold leading-[1.6] tracking-[-0.32px] text-[#212121] [word-break:keep-all]">
          {member?.loginId} 회원을 강제 탈퇴시킬까요?
        </DialogTitle>

        <DialogDescription className="text-center text-[14px] leading-[1.6] tracking-[-0.28px] text-[#757575] [word-break:keep-all]">
          개인정보가 즉시 파기되며 되돌릴 수 없습니다.
        </DialogDescription>

        <DialogFooter className="flex flex-row justify-center gap-[12px] sm:justify-center sm:space-x-0">
          <Button
            type="button"
            onClick={onConfirm}
            className="h-[48px] w-[95px] rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242]"
          >
            탈퇴 처리
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
