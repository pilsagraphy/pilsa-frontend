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
import { getKakaoCalendarLinkUrl, getKakaoCalendarStatus } from '@/apis/kakaoCalendar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

// 일정 구독 버튼 — 누르면 어느 캘린더에 넣을지 고른다: 구글 · 네이버 · 카카오(톡캘린더) · (아이폰만) 아이폰 캘린더.
// 각 선택지와 2단계의 실행 버튼은 브랜드 색·로고로 (PM 2026-10-12).
//  - 구글·카카오: 서버가 각자 캘린더에 일정을 넣고 등록·수정·삭제를 그대로 반영 (콜백 ?calendar= / ?kcalendar=).
//  - 네이버: 네이버 API 는 '일정 추가' 만 있어 새 일정만 넣어 준다. 수정·삭제는 본인이 직접 (콜백 ?ncalendar=).
//  - 아이폰: 기본 캘린더 앱의 webcal 구독. 계정 연동 없이 OS 가 구독 창을 연다.
//  캘린더 연동은 간편로그인 계정 연결과 별개다(토큰이 따로) — 연결 안 했어도 그 계정으로 로그인해 캘린더 권한만 허용하면 된다 (PM 2026-10-13).
const CALENDAR_RESULT = {
  calendar: {
    linked: ['success', '구글 캘린더 구독이 시작됐어요. 동아리 일정이 내 캘린더에 보이기까지 최대 10분 정도 걸릴 수 있어요.'],
    failed: ['error', '구글 캘린더 연동에 실패했어요'],
    cancelled: ['info', '구글 캘린더 연동을 취소했어요.'],
  },
  ncalendar: {
    linked: ['success', '네이버 캘린더에 앞으로의 동아리 일정을 넣는 중이에요. 새 일정이 생기면 그때그때 넣어 드려요.'],
    failed: ['error', '네이버 캘린더 연동에 실패했어요'],
    cancelled: ['info', '네이버 캘린더 연동을 취소했어요.'],
  },
  kcalendar: {
    linked: ['success', '톡캘린더 구독이 시작됐어요. 동아리 일정이 내 톡캘린더에 보이기까지 최대 10분 정도 걸릴 수 있어요.'],
    failed: ['error', '톡캘린더 연동에 실패했어요'],
    cancelled: ['info', '톡캘린더 연동을 취소했어요.'],
  },
};

// 브랜드 로고 (작게, 흰 동그라미 안)
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);
const NaverLogo = () => <span className="text-[15px] font-extrabold leading-none text-[#03C75A]">N</span>;
const KakaoLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#191919" d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.86 5.31 4.66 6.72L5.5 21.5l4.74-2.98c.58.08 1.17.13 1.76.13 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
  </svg>
);
const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#111" d="M16.37 12.8c.02-2.36 1.93-3.5 2.02-3.55-1.1-1.61-2.81-1.83-3.42-1.86-1.46-.15-2.84.86-3.58.86-.74 0-1.88-.84-3.09-.82-1.59.02-3.06.93-3.88 2.35-1.65 2.87-.42 7.12 1.19 9.45.79 1.14 1.72 2.42 2.95 2.37 1.19-.05 1.64-.77 3.07-.77 1.44 0 1.84.77 3.1.74 1.28-.02 2.09-1.16 2.87-2.3.9-1.32 1.27-2.6 1.29-2.66-.03-.01-2.48-.95-2.52-3.81zM14.02 5.86c.65-.79 1.09-1.89.97-2.99-.94.04-2.07.63-2.74 1.42-.6.7-1.13 1.82-.99 2.89 1.05.08 2.11-.53 2.76-1.32z" />
  </svg>
);

// 선택지 — 색·로고·문구. iOS 는 아이폰에서만
const OPTIONS = [
  { key: 'google', label: '구글', calendarLabel: '구글 캘린더', Logo: GoogleLogo, bg: 'bg-white', fg: 'text-[#1f1f1f]', border: 'border-[#dadce0]', note: '등록·수정·삭제 자동 반영' },
  { key: 'naver', label: '네이버', calendarLabel: '네이버 캘린더', Logo: NaverLogo, bg: 'bg-[#03C75A]', fg: 'text-white', border: 'border-[#03C75A]', note: '새 일정만 넣어 드려요' },
  { key: 'kakao', label: '카카오', calendarLabel: '카카오 톡캘린더', Logo: KakaoLogo, bg: 'bg-[#FEE500]', fg: 'text-[#191919]', border: 'border-[#FEE500]', note: '등록·수정·삭제 자동 반영' },
  { key: 'ios', label: '아이폰', calendarLabel: '아이폰 캘린더', Logo: AppleLogo, bg: 'bg-[#f2f2f7]', fg: 'text-[#111]', border: 'border-[#d1d1d6]', note: '기본 캘린더 앱이 구독해요', iosOnly: true },
];
const optionOf = (key) => OPTIONS.find((o) => o.key === key);

// 브랜드 버튼 — 선택 화면과 2단계 실행 버튼이 같은 모양
function BrandButton({ option, children, sub, onClick, disabled }) {
  const o = option;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-[52px] w-full items-center gap-3 rounded-[6px] border px-3 text-left transition hover:brightness-95 disabled:opacity-60 ${o.bg} ${o.fg} ${o.border}`}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
        <o.Logo />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-[1.3]">{children}</span>
        {sub && <span className="block text-[11px] leading-[1.3] opacity-80">{sub}</span>}
      </span>
    </button>
  );
}

export default function CalendarSubscribeButton() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [onIOS, setOnIOS] = useState(false);
  // 고른 캘린더: null(선택 화면) | 'google' | 'naver' | 'kakao'
  const [pick, setPick] = useState(null);
  // 캘린더 연동 상태. undefined = 조회 중, null = 조회 실패
  const [google, setGoogle] = useState(undefined);
  const [naver, setNaver] = useState(undefined);
  const [kakao, setKakao] = useState(undefined);

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
    setKakao(undefined);
    getCalendarLinkStatus().then(setGoogle).catch(() => setGoogle(null));
    getNaverCalendarStatus().then(setNaver).catch(() => setNaver(null));
    getKakaoCalendarStatus().then(setKakao).catch(() => setKakao(null));
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
      const fetchUrl = which === 'naver' ? getNaverCalendarLinkUrl : which === 'kakao' ? getKakaoCalendarLinkUrl : getCalendarLinkUrl;
      const url = await fetchUrl(ROUTES.CALENDAR);
      if (!url) throw new Error('authorizeUrl 없음');
      window.location.href = url;
    } catch (err) {
      toast.error(err?.response?.data?.message ?? `${optionOf(which).label} 연동을 시작하지 못했어요`);
      setBusy(false);
    }
  };

  const primaryBtn = 'h-[48px] w-full rounded-[4px] bg-inverse text-[16px] text-inverse-fg hover:bg-inverse-2 disabled:opacity-60';
  const outlineBtn = 'h-[48px] flex-1 rounded-[4px] border-line-strong text-[15px] text-ink';
  const close = () => {
    setBusy(false);
    setOpen(false);
  };

  const statusOf = { google, naver, kakao };
  const linkedOf = (key) => !!statusOf[key]?.linked;
  const loadingOf = (key) => statusOf[key] === undefined;

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
    body = '구글·네이버·카카오는 그 계정과 연동하면 서버가 동아리 일정을 넣어 드려요.';
    footer = (
      <div className="flex flex-col gap-[8px]">
        {OPTIONS.filter((o) => !o.iosOnly || onIOS).map((o) => (
          <BrandButton
            key={o.key}
            option={o}
            sub={o.note}
            onClick={() => {
              if (o.key === 'ios') {
                // webcal:// 은 OS 가 캘린더 앱으로 넘긴다
                window.location.href = calendarWebcalUrl();
                setOpen(false);
                return;
              }
              setPick(o.key);
            }}
          >
            {o.calendarLabel}
            {linkedOf(o.key) ? ' · 구독 중' : ''}
          </BrandButton>
        ))}
      </div>
    );
  } else {
    const o = optionOf(pick);
    const linked = linkedOf(pick);
    const s = statusOf[pick];
    const who = pick === 'google' ? s?.googleEmail : pick === 'naver' ? s?.naverEmail : s?.kakaoName;
    if (linked) {
      title = `${o.calendarLabel}는 이미 구독 중이에요`;
      body =
        pick === 'naver'
          ? `${who ? `${who} ` : ''}네이버 캘린더에 새 일정이 생길 때마다 넣어 드려요. 네이버는 일정 추가만 되는 서비스라 바뀌거나 지워진 일정은 직접 고쳐야 해요. 연동 관리는 마이페이지 → 설정에서.`
          : `${who ? `${who} ` : ''}${o.calendarLabel}에 새 일정·변경·삭제가 자동으로 반영돼요 (반영까지 최대 10분). 연동 관리는 마이페이지 → 설정에서.`;
      footer = null; // 이미 구독 중 — 확인 버튼 없이 아래 "다른 캘린더 고르기 · 닫기" 만 (PM 2026-10-13)
    } else {
      title = `${o.calendarLabel}에 구독할까요?`;
      body =
        pick === 'google'
          ? '구글 계정에서 캘린더 권한을 허용하면 동아리 일정이 내 구글 캘린더에 자동으로 들어가요. 바뀐 일정도 반영되고, 최대 10분 걸려요. 간편로그인 연결과는 별개예요.'
          : pick === 'kakao'
            ? '카카오 계정에서 톡캘린더 권한을 허용하면 동아리 일정이 내 톡캘린더에 자동으로 들어가요. 바뀐 일정도 반영되고, 최대 10분 걸려요. 간편로그인 연결과는 별개예요.'
            : '네이버 계정에서 캘린더 권한을 허용하면 새 동아리 일정이 내 네이버 캘린더에 들어가요. 바뀐 일정은 직접 고쳐야 해요. 간편로그인 연결과는 별개예요.';
      footer = (
        <BrandButton option={o} onClick={() => startConsent(pick)} disabled={busy || loadingOf(pick)}>
          {busy ? `${o.label}로 이동 중…` : `${o.calendarLabel} 구독하기`}
        </BrandButton>
      );
    }
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
            {/* 2단계: 다른 캘린더 고르기 · 닫기를 한 줄에 (PM 2026-10-13). 이동 중에도 늘 눌린다 — 동의 화면에 갔다가 뒤로 온 사람이 갇히지 않게 */}
            <div className="flex gap-[8px]">
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
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
