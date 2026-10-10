'use client';

import { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SettingsContent from './SettingsContent';

// 설정 모달 (PC). 폰에서는 모달 대신 /mypage/settings 페이지로 간다 (MyInfoCard, PM 2026-10-10).
// 본문은 SettingsContent 가 그린다 — 페이지와 같은 것.
export default function MyInfoEditModal({ open, onOpenChange, myInfo }) {
  // 하위 모달이 열리면 이 모달의 장막을 없앤다 — 장막은 맨 앞 모달만 갖고,
  // 이 모달은 그 장막 아래로 내려가 흐리게 보인다 (농도가 이중으로 겹치지도 않음)
  const [nestedOpen, setNestedOpen] = useState(false);
  const handleNested = useCallback((next) => setNestedOpen(next), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[400px] rounded-[12px] p-6"
        overlayClassName={nestedOpen ? 'bg-transparent' : undefined}
        aria-describedby={undefined}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-[18px] tracking-[-0.02em] text-black">설정</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <SettingsContent myInfo={myInfo} onNestedOpenChange={handleNested} />
        </div>

        <div className="mt-1 flex justify-end">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-[40px] rounded-[6px] bg-[#212121] px-6 text-[14px] font-semibold text-white hover:bg-black"
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
