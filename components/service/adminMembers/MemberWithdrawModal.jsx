'use client';

import { useEffect, useState } from 'react';
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
// error: 탈퇴 처리 실패 메시지 (있으면 모달 안에 노출)
// 사유 필수 — 강제 탈퇴 이력(제재 회원 관리)에 남는다 (PM 2026-10-17). 자주 쓰는 사유는 눌러서 채운다
const QUICK_REASONS = ['동아리 회원 아님 (학번 불일치)', '중복 가입', '본인 요청 (로그인 불가)', '부정 이용'];

export default function MemberWithdrawModal({ member, error, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (member) setReason('');
  }, [member]);
  const trimmed = reason.trim();

  return (
    <Dialog open={Boolean(member)} onOpenChange={(next) => !next && onCancel?.()}>
      <DialogContent
        hideCloseButton
        className="max-w-[380px] gap-[16px] rounded-[4px] border-line p-[24px]"
      >
        <DialogTitle className="text-center text-[16px] font-semibold leading-[1.6] tracking-[-0.32px] text-ink [word-break:keep-all]">
          {member?.loginId} 회원을 강제 탈퇴시킬까요?
        </DialogTitle>

        <DialogDescription className="text-center text-[14px] leading-[1.6] tracking-[-0.28px] text-ink-3 [word-break:keep-all]">
          개인정보가 즉시 파기되며 되돌릴 수 없습니다.
        </DialogDescription>

        <div className="flex flex-col gap-2">
          <label htmlFor="withdraw-reason" className="text-[13px] font-medium text-ink-2">
            사유 <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-full border px-2.5 py-1 text-[12px] ${reason === r ? 'border-ink bg-inverse text-inverse-fg' : 'border-line text-ink-2 hover:border-line-strong'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            id="withdraw-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 300))}
            rows={2}
            placeholder="강제 탈퇴 사유를 적어 주세요"
            className="w-full resize-none rounded-[4px] border border-line-strong bg-surface px-3 py-2 text-[14px] text-ink"
          />
        </div>

        {error && (
          <p className="text-center text-[14px] leading-[1.6] tracking-[-0.28px] text-danger">
            {error}
          </p>
        )}

        <DialogFooter className="flex flex-row justify-center gap-[12px] sm:justify-center sm:space-x-0">
          <Button
            type="button"
            onClick={() => onConfirm(trimmed)}
            disabled={!trimmed}
            className="h-[48px] w-[95px] rounded-[4px] bg-inverse text-[16px] text-inverse-fg hover:bg-inverse-2 disabled:opacity-40"
          >
            탈퇴 처리
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-[48px] w-[87px] rounded-[4px] border-line-strong text-[16px] text-ink"
          >
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
