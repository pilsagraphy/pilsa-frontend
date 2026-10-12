'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import { toast } from '@/lib/toast';
import useAuthStore from '@/stores/useAuthStore';
import { isIOS } from '@/lib/platform';
import { calendarWebcalUrl } from '@/lib/calendarFeed';
import { ROUTES } from '@/constants/routes';
import { loginUrlWithReturnTo } from '@/lib/returnTo';
import { getCalendarLinkStatus, getCalendarLinkUrl } from '@/apis/google';
import { getNaverCalendarLinkUrl, getNaverCalendarStatus } from '@/apis/naverCalendar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

// 일정 구독 버튼 — 누르면 어느 캘린더에 넣을지 고른다: 구글 캘린더 · 네이버 캘린더 · (아이폰만) 아이폰 캘린더 (PM 2026-10-12).
//
//  - 구글: 서버가 각자 구글 캘린더에 일정을 넣고 등록·수정·삭제를 그대로 반영한다 (동의 → 콜백 ?calendar=).
//  - 네이버: 네이버 캘린더 API 는 '일정 추가' 만 있어 새 일정만 넣어 준다. 수정·삭제는 본인이 직접 (동의 → 콜백 ?ncalendar=).
//  - 아이폰: 기본 캘린더 앱의 webcal 구독. 계정 연동 없이 OS 가 구독 창을 연다.
//  구글·네이버는 그 계정과의 연동(동의)이 필요하다는 걸 고른 뒤 한 번 더 알리고 동의 화면으로 보낸다.
//  비로그인은 로그인부터. 돌아올 곳(returnTo)을 함께 보내 콜백이 이 페이지로 돌려보내게 한다.
//
// 참고: 구글 OAuth 동의 화면이 '테스트 중' 이면 테스트 사용자 외에는 전부 403(access_denied)으로 막힌다 — Google Cloud Console 쪽 설정.
const CALENDAR_RESULT = {
  calendar: {
    linked: ['success', '구글 캘린더 구독이 시작됐어요. 동아리 일정이 내 캘린더에 보이기까지 최대 10분 정도 걸릴 수 있어요.'],
    failed: ['error', '구글 캘린더 연동에 실패했어요. 잠시 후 다시 시도해주세요.'],
    cancelled: ['info', '구글 캘린더 연동을 취소했어요.'],
  },
  ncalendar: {
    linked: ['success', '네이버 캘린더에 앞으로의 동아리 일정을 넣는 중이에요. 새 일정이 생기면 그때그때 넣어 드려요.'],
    failed: ['error', '네이버 캘린더 연동에 실패했어요. 잠시 후 다시 시도해주세요.'],
    cancelled: ['info', '네이버 캘린더 연동을 취소했어요.'],
  },
};

export default function CalendarSubscribeButton() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [onIOS, setOnIOS] = useState(false);
  // 고른 캘린더: null(선택 화면) | 'google' | 'naver'
  const [pick, setPick] = useState(null);
  // 연동 상태. undefined = 조회 중, null = 조회 실패
  const [google, setGoogle] = useState(undefined);
  const [naver, setNaver] = useState(undefined);

  useEffect(() => {
    setOnIOS(isIOS());
  }, []);

  // 동의 화면에서 돌아온 결과 안내 — 읽은 뒤 쿼리는 지운다 (useSearchParams 는 Suspense 를 요구해 쓰지 않는다)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, results] of Object.entries(CALENDAR_RESULT)) {
      const entry = results[params.get(key)];
      if (!entry) continue;
      toast[entry[0]](entry[1]);
      params.delete(key);
      const query = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));
    }
  }, []);

  const handleOpen = async () => {
    setPick(null);
    setOpen(true);
    if (!isLoggedIn) return;
    setGoogle(undefined);
    setNaver(undefined);
    getCalendarLinkStatus().then(setGoogle).catch(() => setGoogle(null));
    getNaverCalendarStatus().then(setNaver).catch(() => setNaver(null));
  };

  // 계정 선택 화면에서 뒤로 가기로 돌아오면 브라우저가 이 화면을 그대로 복원해 busy 가 켜진 채 남는다 (테스터 제보, 2026-09-27)
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

  const startConsent = async (which) => {
    if (busy) return;
    setBusy(true);
    try {
      const url = which === 'naver' ? await getNaverCalendarLinkUrl(ROUTES.CALENDAR) : await getCalendarLinkUrl(ROUTES.CALENDAR);
      if (!url) throw new Error('authorizeUrl 없음');
      window.location.href = url;
    } catch (err) {
      toast.error(err?.response?.data?.message ?? `${which === 'naver' ? '네이버' : '구글'} 연동을 시작하지 못했어요. 잠시 후 다시 시도해주세요.`);
      setBusy(false);
    }
  };

  const primaryBtn = 'h-[48px] w-full rounded-[4px] bg-inverse text-[16px] text-inverse-fg hover:bg-inverse-2 disabled:opacity-60';
  const outlineBtn = 'h-[48px] w-full rounded-[4px] border-line-strong text-[16px] text-ink';
  const close = () => {
    setBusy(false);
    setOpen(false);
  };

  // 화면 내용 — 단계별
  let title;
  let body;
  let footer;
  if (!isLoggedIn) {
    title = '로그인이 필요해요';
    body = '동아리 일정을 내 캘린더에 넣어 드려요. 로그인한 뒤 다시 눌러주세요.';
    footer = (
      <Button type="button" onClick={() => router.push(loginUrlWithReturnTo(window.location.pathname))} className={primaryBtn}>
        로그인하기
      </Button>
    );
  } else if (pick === null) {
    title = '어느 캘린더에 넣을까요?';
    body = onIOS
      ? '구글·네이버는 그 계정과 연동해 서버가 일정을 넣어 드리고, 아이폰 캘린더는 기본 캘린더 앱이 바로 구독해요.'
      : '구글·네이버 계정과 연동하면 서버가 동아리 일정을 그 캘린더에 넣어 드려요.';
    footer = (
      <>
        <Button type="button" onClick={() => setPick('google')} className={primaryBtn}>
          구글 캘린더{google?.linked ? ' (구독 중)' : ''}
        </Button>
        <Button type="button" variant="outline" onClick={() => setPick('naver')} className={outlineBtn}>
          네이버 캘린더{naver?.linked ? ' (연동 중)' : ''}
        </Button>
        {onIOS && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // webcal:// 은 OS 가 캘린더 앱으로 넘긴다
              window.location.href = calendarWebcalUrl();
              setOpen(false);
            }}
            className={outlineBtn}
          >
            아이폰 캘린더에 구독
          </Button>
        )}
      </>
    );
  } else if (pick === 'google') {
    const linked = !!google?.linked;
    title = linked ? '구글 캘린더는 이미 구독 중이에요' : '구글 계정과 연동이 필요해요';
    body = linked
      ? `${google.googleEmail ? `${google.googleEmail} ` : ''}구글 캘린더에 새 일정·변경·삭제가 자동으로 반영돼요 (반영까지 최대 10분). 연동 관리는 마이페이지 → 설정에서.`
      : '구글 계정을 고르고 캘린더 권한을 허용하면 동아리 일정이 내 구글 캘린더에 자동 등록되고, 수정·삭제가 그대로 반영돼요 (반영까지 최대 10분).';
    footer = linked ? (
      <Button type="button" onClick={close} className={primaryBtn}>
        확인
      </Button>
    ) : (
      <Button type="button" onClick={() => startConsent('google')} disabled={busy || google === undefined} className={primaryBtn}>
        {busy ? '구글로 이동 중…' : '구글로 연동하고 구독하기'}
      </Button>
    );
  } else {
    const linked = !!naver?.linked;
    title = linked ? '네이버 캘린더는 이미 연동 중이에요' : '네이버 계정과 연동이 필요해요';
    body = linked
      ? `${naver.naverEmail ? `${naver.naverEmail} ` : ''}네이버 캘린더에 새 일정이 생길 때마다 넣어 드려요. 네이버는 일정 추가만 되는 서비스라 바뀌거나 지워진 일정은 직접 고쳐야 해요. 연동 관리는 마이페이지 → 설정에서.`
      : '네이버 계정으로 로그인하고 캘린더 권한을 허용하면 동아리 일정이 내 네이버 캘린더에 자동 등록돼요 (추가만 — 수정·삭제는 직접 해야 해요).';
    footer = linked ? (
      <Button type="button" onClick={close} className={primaryBtn}>
        확인
      </Button>
    ) : (
      <Button type="button" onClick={() => startConsent('naver')} disabled={busy || naver === undefined} className={primaryBtn}>
        {busy ? '네이버로 이동 중…' : '네이버로 연동하고 넣기'}
      </Button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-[8px] border border-line px-3 text-[13px] font-medium text-ink-2 transition hover:border-line-strong hover:text-ink sm:h-[40px] sm:px-4 sm:text-[14px]"
      >
        <CalendarPlus size={16} />내 캘린더에 구독
      </button>

      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent hideCloseButton className="max-w-[380px] gap-[20px] rounded-[4px] border-line p-[24px]">
          <DialogTitle className="text-center text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-ink [word-break:keep-all]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-[14px] leading-[1.7] tracking-[-0.28px] text-ink-2 [word-break:keep-all]">
            {body}
          </DialogDescription>

          <DialogFooter className="flex flex-col gap-[8px] sm:flex-col sm:space-x-0">
            {footer}
            {/* 뒤로·닫기는 이동 중에도 늘 눌린다 — 동의 화면에 갔다가 뒤로 온 사람이 갇히지 않게 */}
            {isLoggedIn && pick !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBusy(false);
                  setPick(null);
                }}
                className={outlineBtn}
              >
                다른 캘린더 고르기
              </Button>
            )}
            <Button type="button" variant="outline" onClick={close} className={outlineBtn}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
