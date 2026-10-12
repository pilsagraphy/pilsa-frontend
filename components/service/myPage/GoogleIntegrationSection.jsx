'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';
import { confirmDialog } from '@/stores/useDialogStore';
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
  // 서버 응답: { linked, lastSyncedAt, syncedCount, failedCount } — syncedCount 는 화면에 쓰지 않는다(위 문구 주석 참고)
  const [calendar, setCalendar] = useState(null);
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


  // 동의 화면에 갔다가 뒤로 오면 브라우저(bfcache)가 이 화면을 그대로 복원해 busy 가 켜진 채 남아 토글이 비활성으로 보였다 — 복원·복귀 때 푼다 (PM 2026-10-13)
  useEffect(() => {
    const release = () => setBusy(false);
    const onPageShow = (e) => {
      if (e.persisted) release();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') release();
    };
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // 동의 화면으로 이동. 돌아올 때는 백엔드가 returnTo(설정 페이지)?google=linked 등으로 리다이렉트한다
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
      // 캘린더 연동은 별개(토큰이 따로)라 여기서 끊지 않는다 — 캘린더 토글에서 따로 (PM 2026-10-13 결정)
      toast.success('구글 계정 연결을 해제했어요');
    } catch (err) {
      // 비밀번호 없는 소셜 전용 계정의 마지막 연결이면 서버가 409 로 막는다 — 그 문구를 그대로 보여 준다
      toast.error(getErrorMessage(err, '연결 해제에 실패했어요'));
    } finally {
      setBusy(false);
    }
  };

  const handleCalendarToggle = async () => {
    if (busy || loading) return;

    if (!calendar?.linked) {
      await goToConsent(() => getCalendarLinkUrl(ROUTES.MY_PAGE_SETTINGS), '구글 캘린더 연동을 시작하지 못했어요');
      return;
    }

    // 바깥 클릭·ESC 가 곧 '일정은 두기' 로 읽혀 취소할 길이 없었다 — 해제 여부를 먼저 묻고, 그 다음 일정 삭제 여부 (감사 2026-10-13)
    const go = await confirmDialog('구글 캘린더 연동을 끌까요?', { confirmText: '끄기', cancelText: '취소' });
    if (!go) return;
    // 이미 담긴 일정을 말없이 지우면 안 된다 — 그걸 보고 일정을 잡았을 수 있다
    const removeEvents = await confirmDialog('넣어 둔 일정도 구글 캘린더에서 지울까요?', { confirmText: '일정도 지우기', cancelText: '일정은 두기' });

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
      toast.error('연동 해제에 실패했어요');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[8px] border border-line px-4 py-3">
        <p className="text-[13px] tracking-[-0.02em] text-ink-4">불러오는 중…</p>
      </div>
    );
  }

  const calendarOn = !!calendar?.linked;
  const hasSyncFailure = calendarOn && calendar?.failedCount > 0;

  return (
    <div className="rounded-[8px] border border-line">
      {/* 계정 연결 */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-[1.5] tracking-[-0.02em] text-ink">
            구글 계정
          </p>
          <p className="mt-0.5 truncate text-[12px] leading-[1.5] tracking-[-0.02em] text-ink-3">
            {account?.linked ? account.googleEmail : '연결하면 구글로 로그인할 수 있어요'}
          </p>
          {account?.linked && calendar?.linked && account.googleEmail !== calendar.googleEmail && (
            // 로그인용과 캘린더용 구글 계정이 다를 수 있다(각각 따로 동의를 받는다).
            // 어느 캘린더에 일정이 들어가는지 헷갈리지 않도록 다를 때만 짚어 준다.
            <p className="mt-0.5 truncate text-[12px] leading-[1.5] tracking-[-0.02em] text-ink-4">
              동아리 일정은 {calendar.googleEmail} 캘린더에 반영해 드려요
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={
            account?.linked
              ? handleUnlinkAccount
              : () => goToConsent(() => getGoogleLinkUrl(ROUTES.MY_PAGE_SETTINGS), '구글 계정 연결을 시작하지 못했어요')
          }
          className="shrink-0 rounded-[6px] border border-line px-3 py-1.5 text-[12px] font-medium text-ink-2 transition hover:border-line-strong hover:text-ink disabled:opacity-50"
        >
          {account?.linked ? '해제' : '연결'}
        </button>
      </div>

      {/* 캘린더 자동 등록 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-[1.5] tracking-[-0.02em] text-ink">
            내 구글 캘린더에 일정 자동 등록
          </p>
          <p className="mt-0.5 text-[12px] leading-[1.5] tracking-[-0.02em] text-ink-3 [word-break:keep-all]">
            {/* 건수는 보여 주지 않는다 — 사용자가 확인할 것은 '켜져 있는지' 이지 몇 건이 들어갔는지가 아니고,
                숫자가 보이면 오히려 "왜 2건뿐이지" 하고 헤아리게 된다.
                문구는 무엇이 어디로 가는지 주어를 밝혀 쓴다 (알림 토글의 '알려드려요' 와 같은 말투) */}
            {hasSyncFailure
              ? '일부 일정을 반영하지 못했어요. 연동을 해제한 뒤 다시 켜주세요.'
              : '동아리 일정이 내 캘린더에 자동으로 들어가요. 바뀌거나 지워진 일정도 그대로 반영돼요'}
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
            calendarOn ? 'bg-inverse' : 'bg-line'
          }`}
        >
          <span
            className={`absolute left-[3px] top-[3px] size-5 rounded-full shadow transition-transform duration-200 ${
              calendarOn ? 'translate-x-[20px] bg-inverse-fg' : 'translate-x-0 bg-white'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
