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
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/apis/auth';
import { updateMyProfile } from '@/apis/mypage';
import useThemeStore, { THEMES } from '@/stores/useThemeStore';
import { isSidebarSwipeEnabled, setSidebarSwipeEnabled } from '@/lib/sidebarSwipe';

// 설정 본문 — 내 정보 / 화면 / 알림 / 간편로그인·캘린더 연동 / 계정. 폰·PC 모두 페이지(/mypage/settings)가 그린다 (PM 2026-10-12).
// 알림·연동은 접었다 펼 수 있다 — 스위치가 많아 펼쳐 두면 설정 전체가 길어진다.
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

// 폰에서 쓸어 사이드바 열기 켜고 끄기 — 기본값은 아이폰 끔·그 밖 켬(lib/sidebarSwipe). 이 기기에만 저장. PC 는 사이드바가 늘 보여 숨긴다
function SidebarSwipeRow() {
  const [on, setOn] = useState(null); // null = 아직 모름(서버 렌더)
  useEffect(() => {
    setOn(isSidebarSwipeEnabled());
  }, []);
  if (on === null) return null;
  const toggle = () => {
    setSidebarSwipeEnabled(!on);
    setOn(!on);
  };
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 md:hidden">
      <div className="min-w-0">
        <p className="text-[13px] tracking-[-0.02em] text-ink-3">쓸어서 메뉴 열기</p>
        <p className="mt-0.5 text-[12px] tracking-[-0.02em] text-ink-4">화면을 오른쪽으로 쓸면 사이드바가 열려요</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`쓸어서 메뉴 열기 ${on ? '켜짐' : '꺼짐'}`}
        onClick={toggle}
        className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 ${on ? 'bg-inverse' : 'bg-line'}`}
      >
        <span
          className={`absolute left-[3px] top-[3px] size-5 rounded-full shadow transition-transform duration-200 ${
            on ? 'translate-x-[20px] bg-inverse-fg' : 'translate-x-0 bg-white'
          }`}
        />
      </button>
    </div>
  );
}

// 이름·연락처 고치기 (PM 2026-10-12 "설정에 본인 개인정보 수정") — 회원가입과 같은 규칙. 저장하면 PUT /api/user/mypage/profile
function ProfileEditRows({ myInfo, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(myInfo?.name ?? '');
  const [phone, setPhone] = useState(myInfo?.phone ?? '');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!editing) {
      setName(myInfo?.name ?? '');
      setPhone(myInfo?.phone ?? '');
    }
  }, [myInfo?.name, myInfo?.phone, editing]);

  const formatPhone = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };

  const save = async () => {
    if (name.trim().length < 2 || name.trim().length > 20) {
      toast.error('이름은 2~20자로 적어 주세요.');
      return;
    }
    if (!/^010-\d{4}-\d{4}$/.test(phone)) {
      toast.error('연락처는 010-0000-0000 꼴로 적어 주세요.');
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile({ name: name.trim(), phone });
      toast.success('내 정보를 고쳤어요.');
      setEditing(false);
      onSaved?.();
    } catch (err) {
      toast.error(getErrorMessage(err, '고치지 못했어요.'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'h-[32px] w-[180px] max-w-full rounded-[6px] border border-line bg-surface px-2 text-right text-[13px] text-ink outline-none focus:border-ink-3';
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="text-[13px] tracking-[-0.02em] text-ink-3">이름</span>
        {editing ? (
          <input type="text" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} className={inputClass} />
        ) : (
          <span className="text-[13px] font-medium tracking-[-0.02em] text-ink">{myInfo?.name || '-'}</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="text-[13px] tracking-[-0.02em] text-ink-3">연락처</span>
        {editing ? (
          <input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="010-0000-0000" className={inputClass} />
        ) : (
          <span className="text-[13px] font-medium tracking-[-0.02em] text-ink">{myInfo?.phone || '-'}</span>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 px-4 py-2">
        {editing ? (
          <>
            <button type="button" onClick={() => setEditing(false)} disabled={saving} className="h-[30px] rounded-[6px] border border-line px-3 text-[12px] text-ink-2">
              취소
            </button>
            <button type="button" onClick={save} disabled={saving} className="h-[30px] rounded-[6px] bg-inverse px-3 text-[12px] text-inverse-fg disabled:opacity-50">
              {saving ? '저장 중…' : '저장'}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="h-[30px] rounded-[6px] border border-line px-3 text-[12px] text-ink-2 hover:border-line-strong hover:text-ink">
            이름·연락처 고치기
          </button>
        )}
      </div>
    </>
  );
}

export default function SettingsContent({ myInfo, onNestedOpenChange, onProfileSaved }) {
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
      {/* 1. 내 정보 — 아이디·가입일은 읽기만, 이름·연락처는 고칠 수 있다 (GET /api/user/mypage) */}
      <section className="flex flex-col gap-1">
        <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-ink-3">내 정보</h4>
        <div className="rounded-[8px] border border-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[13px] tracking-[-0.02em] text-ink-3">아이디</span>
            <span className="text-[13px] font-medium tracking-[-0.02em] text-ink">{myInfo?.loginId ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[13px] tracking-[-0.02em] text-ink-3">가입일</span>
            <span className="text-[13px] font-medium tracking-[-0.02em] text-ink">{myInfo?.joinedAt ?? '-'}</span>
          </div>
          <ProfileEditRows myInfo={myInfo} onSaved={onProfileSaved} />
        </div>
      </section>

      {/* 2. 화면 — 시스템 설정 따름 / 라이트 / 다크 (PM 2026-10-11). 이 기기(브라우저)에만 저장된다 */}
      <section className="flex flex-col gap-1">
        <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-ink-3">화면</h4>
        <div className="rounded-[8px] border border-line">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span className="text-[13px] tracking-[-0.02em] text-ink-3">다크 모드</span>
            <ThemeSegment />
          </div>
          <SidebarSwipeRow />
        </div>
      </section>

      {/* 3. 간편로그인 · 캘린더 — 구글(계정 + 캘린더 자동 업데이트) · 네이버(계정 + 캘린더 새 일정 넣기) · 카카오(계정). 제공자마다 한 상자. 알림보다 위, 기본 펼침 (PM 2026-10-13) */}
      <Collapsible title="간편로그인 · 캘린더 연동" defaultOpen>
        <div className="flex flex-col gap-2">
          <GoogleIntegrationSection />
          <SocialAccountsSection />
        </div>
      </Collapsible>

      {/* 4. 알림 — '무엇을 받을지'(유형 스위치)는 PC·폰 모두, '이 기기에서 받을지'(푸시 토글)는 모바일에서만 */}
      <Collapsible title="알림" defaultOpen>
        <div className="rounded-[8px] border border-line px-4">
          {showPushToggle && (
            <div className="border-b border-line py-3">
              <NotificationToggle />
            </div>
          )}
          <NotificationPreferences />
        </div>
      </Collapsible>

      {/* 5. 계정 */}
      <section className="flex flex-col gap-1">
        <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-ink-3">계정</h4>
        <div className="rounded-[8px] border border-line">
          <button
            type="button"
            onClick={() => setPasswordOpen(true)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-surface-2"
          >
            <div>
              {/* 비밀번호 없는 소셜 가입 회원(socialOnly)은 '만들기' — 만들면 아이디·비밀번호로도 로그인할 수 있다 (PM 2026-10-13) */}
              <p className="text-[14px] font-medium tracking-[-0.02em] text-ink">{myInfo?.socialOnly ? '비밀번호 만들기' : '비밀번호 재설정'}</p>
              <p className="mt-0.5 text-[12px] tracking-[-0.02em] text-ink-3">
                {myInfo?.socialOnly ? '간편 로그인 전용 계정이에요. 비밀번호를 만들면 아이디로도 로그인할 수 있어요' : '현재 비밀번호 확인 후 새 비밀번호로 변경해요'}
              </p>
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

      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} socialOnly={!!myInfo?.socialOnly} />
      <PasswordChangeModal open={passwordOpen} onOpenChange={setPasswordOpen} createMode={!!myInfo?.socialOnly} />
    </>
  );
}
