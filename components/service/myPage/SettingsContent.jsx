'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import NotificationToggle from './NotificationToggle';
import NotificationPreferences from './NotificationPreferences';
import GoogleIntegrationSection from './GoogleIntegrationSection';
import SocialAccountsSection from './SocialAccountsSection';
import WithdrawModal from './WithdrawModal';
import PasswordChangeModal from './PasswordChangeModal';
import { canShowPushToggle } from '@/lib/push';
import useThemeStore, { THEMES } from '@/stores/useThemeStore';

// 설정 본문 — 내 정보 / 화면 / 알림 / 구글 연동 / 계정. PC 는 모달(MyInfoEditModal), 폰은 페이지(/mypage/settings)가 같은 것을 그린다 (PM 2026-10-10).
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
        <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-ink-3">{title}</h4>
        <ChevronDown
          size={16}
          className={`text-ink-4 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && children}
    </section>
  );
}

// 화면 모드 3택 — 고른 즉시 적용(useThemeStore.setTheme 이 html.dark 를 바꾼다)
function ThemeSegment() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  return (
    <div role="radiogroup" aria-label="화면 모드" className="flex rounded-[6px] border border-line bg-surface p-[2px]">
      {THEMES.map((t) => (
        <button
          key={t.key}
          type="button"
          role="radio"
          aria-checked={theme === t.key}
          onClick={() => setTheme(t.key)}
          className={`h-[26px] rounded-[4px] px-2.5 text-[12px] tracking-[-0.02em] transition ${
            theme === t.key ? 'bg-inverse font-medium text-inverse-fg' : 'text-ink-2 hover:bg-surface-2'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
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
        <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-ink-3">내 정보</h4>
        <div className="rounded-[8px] border border-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[13px] tracking-[-0.02em] text-ink-3">아이디</span>
            <span className="text-[13px] font-medium tracking-[-0.02em] text-ink">{myInfo?.loginId ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[13px] tracking-[-0.02em] text-ink-3">가입일</span>
            <span className="text-[13px] font-medium tracking-[-0.02em] text-ink">{myInfo?.joinedAt ?? '-'}</span>
          </div>
        </div>
      </section>

      {/* 2. 화면 — 시스템 설정 따름 / 라이트 / 다크 (PM 2026-10-11). 이 기기(브라우저)에만 저장된다 */}
      <section className="flex flex-col gap-1">
        <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-ink-3">화면</h4>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-line px-4 py-3">
          <span className="text-[13px] tracking-[-0.02em] text-ink-3">다크 모드</span>
          <ThemeSegment />
        </div>
      </section>

      {/* 3. 알림 — '무엇을 받을지'(유형 스위치)는 PC·폰 모두, '이 기기에서 받을지'(푸시 토글)는 모바일에서만 */}
      <Collapsible title="알림">
        <div className="rounded-[8px] border border-line px-4">
          {showPushToggle && (
            <div className="border-b border-line py-3">
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

      {/* 3-1. 네이버·카카오 계정 연결 — 소셜 로그인용 (PM 2026-10-11) */}
      <Collapsible title="네이버 · 카카오 연동">
        <SocialAccountsSection />
      </Collapsible>

      {/* 4. 계정 */}
      <section className="flex flex-col gap-1">
        <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-ink-3">계정</h4>
        <div className="rounded-[8px] border border-line">
          <button
            type="button"
            onClick={() => setPasswordOpen(true)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-surface-2"
          >
            <div>
              <p className="text-[14px] font-medium tracking-[-0.02em] text-ink">비밀번호 재설정</p>
              <p className="mt-0.5 text-[12px] tracking-[-0.02em] text-ink-3">현재 비밀번호 확인 후 새 비밀번호로 변경해요</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-ink-4" />
          </button>
        </div>
      </section>

      {/* 탈퇴는 관례대로 좌하단에 작게 — 실수 클릭 방지 */}
      <button
        type="button"
        onClick={() => setWithdrawOpen(true)}
        className="w-fit text-[12px] tracking-[-0.02em] text-ink-4 underline-offset-2 transition hover:text-ink-3 hover:underline"
      >
        회원 탈퇴
      </button>

      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
      <PasswordChangeModal open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
