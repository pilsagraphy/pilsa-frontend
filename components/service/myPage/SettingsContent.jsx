'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import NotificationToggle from './NotificationToggle';
import NotificationPreferences from './NotificationPreferences';
import GoogleIntegrationSection from './GoogleIntegrationSection';
import WithdrawModal from './WithdrawModal';
import PasswordChangeModal from './PasswordChangeModal';
import { canShowPushToggle } from '@/lib/push';

// 설정 본문 — 내 정보 / 알림 / 구글 연동 / 계정. PC 는 모달(MyInfoEditModal), 폰은 페이지(/mypage/settings)가 같은 것을 그린다 (PM 2026-10-10).
// 알림·구글 연동은 접었다 펼 수 있다 — 스위치가 네 개라 펼쳐 두면 설정 전체가 길어진다 (PM: "알림 아래로 열리고 닫혔으면").
// onNestedOpenChange: 하위 모달(비밀번호·탈퇴)이 열렸는지 — 모달 안에서 쓸 때 장막을 겹치지 않게 부모가 알아야 한다.
function Collapsible({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center justify-between py-1 text-left"
      >
        <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-[#919191]">{title}</h4>
        <ChevronDown
          size={16}
          className={`text-[#B9B9B9] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && children}
    </section>
  );
}

export default function SettingsContent({ myInfo, onNestedOpenChange }) {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  // UA 판별은 클라이언트에서만 가능 — SSR 하이드레이션 불일치를 피하려고 mount 후 결정
  const [showPushToggle, setShowPushToggle] = useState(false);
  useEffect(() => {
    setShowPushToggle(canShowPushToggle());
  }, []);
  useEffect(() => {
    onNestedOpenChange?.(withdrawOpen || passwordOpen);
  }, [withdrawOpen, passwordOpen, onNestedOpenChange]);

  return (
    <>
      {/* 1. 내 정보 — 아이디·가입일은 마이페이지 요약(GET /api/user/mypage)에서 온 값 */}
      <section className="flex flex-col gap-1">
        <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-[#919191]">내 정보</h4>
        <div className="rounded-[8px] border border-black/10">
          <div className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-3">
            <span className="text-[13px] tracking-[-0.02em] text-[#757575]">아이디</span>
            <span className="text-[13px] font-medium tracking-[-0.02em] text-black">{myInfo?.loginId ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[13px] tracking-[-0.02em] text-[#757575]">가입일</span>
            <span className="text-[13px] font-medium tracking-[-0.02em] text-black">{myInfo?.joinedAt ?? '-'}</span>
          </div>
        </div>
      </section>

      {/* 2. 알림 — '무엇을 받을지'(유형 스위치)는 PC·폰 모두, '이 기기에서 받을지'(푸시 토글)는 모바일에서만 */}
      <Collapsible title="알림">
        <div className="rounded-[8px] border border-black/10 px-4">
          {showPushToggle && (
            <div className="border-b border-black/10 py-3">
              <NotificationToggle />
            </div>
          )}
          <NotificationPreferences />
        </div>
      </Collapsible>

      {/* 3. 구글 연동 — 계정 연결(소셜 로그인) + 캘린더 자동 등록 */}
      <Collapsible title="구글 연동">
        <GoogleIntegrationSection />
      </Collapsible>

      {/* 4. 계정 */}
      <section className="flex flex-col gap-1">
        <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-[#919191]">계정</h4>
        <div className="rounded-[8px] border border-black/10">
          <button
            type="button"
            onClick={() => setPasswordOpen(true)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#FAFAFA]"
          >
            <div>
              <p className="text-[14px] font-medium tracking-[-0.02em] text-[#212121]">비밀번호 재설정</p>
              <p className="mt-0.5 text-[12px] tracking-[-0.02em] text-[#919191]">현재 비밀번호 확인 후 새 비밀번호로 변경해요</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-[#B9B9B9]" />
          </button>
        </div>
      </section>

      {/* 탈퇴는 관례대로 좌하단에 작게 — 실수 클릭 방지 */}
      <button
        type="button"
        onClick={() => setWithdrawOpen(true)}
        className="w-fit text-[12px] tracking-[-0.02em] text-[#B9B9B9] underline-offset-2 transition hover:text-[#757575] hover:underline"
      >
        회원 탈퇴
      </button>

      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
      <PasswordChangeModal open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
