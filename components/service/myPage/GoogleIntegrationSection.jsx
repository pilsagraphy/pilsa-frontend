'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getGoogleLinkStatus,
  getGoogleLinkUrl,
  unlinkGoogleAccount,
  getCalendarLinkStatus,
  getCalendarLinkUrl,
  unlinkCalendar,
} from '@/apis/google';

// 구글 연동 — 계정 연결 + 캘린더 자동 등록
//
// 캘린더가 "구독"이 아니라 "서버가 넣어주기"인 이유:
// Google Calendar API 에는 외부 ICS URL 을 구독으로 추가하는 방법이 없고,
// 안드로이드 구글 캘린더 앱에는 URL 구독 기능 자체가 없다.
// 그래서 동의를 받아 서버가 각자 캘린더에 일정을 직접 넣는다 — 사용자에게는 구독처럼 보인다.
export default function GoogleIntegrationSection() {
  const [account, setAccount] = useState(null); // { linked, googleEmail, linkedAt }
  const [calendar, setCalendar] = useState(null); // { linked, lastSyncedAt, syncedCount, failedCount }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [accountStatus, calendarStatus] = await Promise.all([
          getGoogleLinkStatus(),
          getCalendarLinkStatus(),
        ]);
        setAccount(accountStatus);
        setCalendar(calendarStatus);
      } catch {
        // 백엔드 미배포(404)면 연동 없음으로 그린다 — 모달 전체가 깨지면 안 된다
        setAccount({ linked: false });
        setCalendar({ linked: false });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 동의 화면으로 이동. 돌아올 때는 백엔드가 /user/myPage?google=linked 등으로 리다이렉트한다
  const goToConsent = async (fetchUrl, failMessage) => {
    if (busy) return;
    setBusy(true);
    try {
      const url = await fetchUrl();
      if (!url) throw new Error('authorizeUrl 없음');
      window.location.href = url;
    } catch {
      toast.error(failMessage);
      setBusy(false);
    }
  };

  const handleUnlinkAccount = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await unlinkGoogleAccount();
      setAccount({ linked: false });
      // 캘린더 연동은 별도 동의로 받은 별개 기능이라 여기서 함께 끊지 않는다.
      // 캘린더를 끄려면 아래 토글을 따로 내려야 한다.
      toast.success('구글 계정 연결을 해제했어요');
    } catch {
      toast.error('연결 해제에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  const handleCalendarToggle = async () => {
    if (busy || loading) return;

    if (!calendar?.linked) {
      await goToConsent(getCalendarLinkUrl, '구글 캘린더 연동을 시작하지 못했어요');
      return;
    }

    // 이미 담긴 일정을 말없이 지우면 안 된다 — 그걸 보고 일정을 잡았을 수 있다
    const removeEvents = window.confirm(
      '연동을 해제합니다.\n\n그동안 등록된 일정도 구글 캘린더에서 삭제할까요?\n\n[확인] 일정도 삭제   [취소] 일정은 그대로 두기'
    );

    setBusy(true);
    try {
      const result = await unlinkCalendar(removeEvents);
      setCalendar({ linked: false });
      toast.success(
        removeEvents && result?.removedEvents
          ? `연동을 해제하고 일정 ${result.removedEvents}건을 삭제했어요`
          : '구글 캘린더 연동을 해제했어요'
      );
    } catch {
      toast.error('연동 해제에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[8px] border border-black/10 px-4 py-3">
        <p className="text-[13px] tracking-[-0.02em] text-[#B9B9B9]">불러오는 중…</p>
      </div>
    );
  }

  const calendarOn = !!calendar?.linked;
  const hasSyncFailure = calendarOn && calendar?.failedCount > 0;

  return (
    <div className="rounded-[8px] border border-black/10">
      {/* 계정 연결 */}
      <div className="flex items-center justify-between gap-3 border-b border-[#F0F0F0] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-[1.5] tracking-[-0.02em] text-[#212121]">
            구글 계정
          </p>
          <p className="mt-0.5 truncate text-[12px] leading-[1.5] tracking-[-0.02em] text-[#919191]">
            {account?.linked ? account.googleEmail : '연결하면 구글로 로그인할 수 있어요'}
          </p>
          {account?.linked && calendar?.linked && account.googleEmail !== calendar.googleEmail && (
            // 로그인용과 캘린더용 구글 계정이 다를 수 있다(각각 따로 동의를 받는다).
            // 어느 캘린더에 일정이 들어가는지 헷갈리지 않도록 다를 때만 짚어 준다.
            <p className="mt-0.5 truncate text-[12px] leading-[1.5] tracking-[-0.02em] text-[#B9B9B9]">
              일정은 {calendar.googleEmail} 캘린더로 들어가요
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={
            account?.linked
              ? handleUnlinkAccount
              : () => goToConsent(getGoogleLinkUrl, '구글 계정 연결을 시작하지 못했어요')
          }
          className="shrink-0 rounded-[6px] border border-[#E0E0E0] px-3 py-1.5 text-[12px] font-medium text-[#454545] transition hover:border-[#BDBDBD] hover:text-[#212121] disabled:opacity-50"
        >
          {account?.linked ? '해제' : '연결'}
        </button>
      </div>

      {/* 캘린더 자동 등록 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-[1.5] tracking-[-0.02em] text-[#212121]">
            내 구글 캘린더에 일정 자동 등록
          </p>
          <p className="mt-0.5 text-[12px] leading-[1.5] tracking-[-0.02em] text-[#919191] [word-break:keep-all]">
            {hasSyncFailure
              ? '동기화에 실패한 일정이 있어요. 해제 후 다시 연동해주세요.'
              : calendarOn
                ? `동아리 일정이 자동으로 들어가요${
                    calendar?.syncedCount ? ` (${calendar.syncedCount}건 등록됨)` : ''
                  }`
                : '등록·수정된 동아리 일정이 내 캘린더에 자동 반영돼요'}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={calendarOn}
          aria-label="내 구글 캘린더에 일정 자동 등록"
          disabled={busy}
          onClick={handleCalendarToggle}
          className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${
            calendarOn ? 'bg-[#212121]' : 'bg-[#D6D6D6]'
          }`}
        >
          <span
            className={`absolute left-[3px] top-[3px] size-5 rounded-full bg-white shadow transition-transform duration-200 ${
              calendarOn ? 'translate-x-[20px]' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
