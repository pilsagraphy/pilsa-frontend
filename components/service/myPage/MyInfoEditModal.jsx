'use client';

import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import NotificationToggle from './NotificationToggle';
import WithdrawModal from './WithdrawModal';
import PasswordChangeModal from './PasswordChangeModal';
import { canShowPushToggle } from '@/lib/push';

// 정보 수정 모달 — 내 정보 / 알림 설정 / 계정 관리(비밀번호 재설정·회원 탈퇴)를 구분해 배치
// ※ 알림 설정은 비밀번호 재설정과 별도 섹션 (요청 사항)
// ※ 알림 섹션은 모바일(+푸시 지원)에서만 노출 — PC 웹은 알림함(종 아이콘)만 제공 (PM 확정 정책)
export default function MyInfoEditModal({ open, onOpenChange, myInfo }) {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  // UA 판별은 클라이언트에서만 가능 — SSR 하이드레이션 불일치를 피하려고 mount 후 결정
  const [showNotificationSection, setShowNotificationSection] = useState(false);

  useEffect(() => {
    setShowNotificationSection(canShowPushToggle());
  }, []);

  // 하위 모달이 열리면 이 모달의 장막을 없앤다 — 장막은 맨 앞 모달만 갖고,
  // 이 모달은 그 장막 아래로 내려가 흐리게 보인다 (농도가 이중으로 겹치지도 않음)
  const nestedOpen = withdrawOpen || passwordOpen;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-[400px] rounded-[12px] p-6"
          overlayClassName={nestedOpen ? 'bg-transparent' : undefined}
          aria-describedby={undefined}
        >
          <DialogHeader className="text-left">
            <DialogTitle className="text-[18px] tracking-[-0.02em] text-black">
              정보 수정
            </DialogTitle>
          </DialogHeader>

          {/* 1. 내 정보 */}
          {/* TODO: API 연결 (내 정보) — 백엔드 마이페이지 조회 API 배포 후 연동 (이번 작업 범위 외) */}
          <section className="flex flex-col gap-1">
            <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-[#919191]">내 정보</h4>
            <div className="rounded-[8px] border border-black/10">
              <div className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-3">
                <span className="text-[13px] tracking-[-0.02em] text-[#757575]">아이디</span>
                <span className="text-[13px] font-medium tracking-[-0.02em] text-black">
                  {myInfo?.loginId ?? '-'}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] tracking-[-0.02em] text-[#757575]">가입일</span>
                <span className="text-[13px] font-medium tracking-[-0.02em] text-black">
                  {myInfo?.joinedAt ?? '-'}
                </span>
              </div>
            </div>
          </section>

          {/* 2. 알림 — 비밀번호 재설정(계정)과 구분된 독립 섹션. 모바일에서만 노출 */}
          {showNotificationSection && (
            <section className="flex flex-col gap-1">
              <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-[#919191]">알림</h4>
              <div className="rounded-[8px] border border-black/10 px-4 py-3">
                <NotificationToggle />
              </div>
            </section>
          )}

          {/* 3. 계정 */}
          <section className="flex flex-col gap-1">
            <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-[#919191]">계정</h4>
            <div className="rounded-[8px] border border-black/10">
              {/* 페이지 이동 없이 모달 안에서 처리 (현재 비밀번호 + 새 비밀번호) */}
              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#FAFAFA]"
              >
                <div>
                  <p className="text-[14px] font-medium tracking-[-0.02em] text-[#212121]">
                    비밀번호 재설정
                  </p>
                  <p className="mt-0.5 text-[12px] tracking-[-0.02em] text-[#919191]">
                    현재 비밀번호 확인 후 새 비밀번호로 변경해요
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-[#B9B9B9]" />
              </button>
            </div>
          </section>

          <div className="mt-1 flex items-center justify-between">
            {/* 탈퇴는 관례대로 좌하단에 작게 — 실수 클릭 방지 */}
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className="text-[12px] tracking-[-0.02em] text-[#B9B9B9] underline-offset-2 transition hover:text-[#757575] hover:underline"
            >
              회원 탈퇴
            </button>
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

      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
      <PasswordChangeModal open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
