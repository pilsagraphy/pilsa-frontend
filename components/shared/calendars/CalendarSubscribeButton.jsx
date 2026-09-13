'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES } from '@/constants/routes';
import { loginUrlWithReturnTo } from '@/lib/returnTo';
import { getCalendarLinkStatus, getCalendarLinkUrl } from '@/apis/google';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

// 일정 구독 버튼 — 구글 캘린더 자동 등록 하나로 간다.
//
//  1) 비로그인 → 로그인부터 하라고 안내한다.
//  2) 로그인 → 플랫폼(안드로이드·아이폰·PC)을 가리지 않고 구글 캘린더 API 연동으로 구독한다.
//     서버가 동아리 일정을 각자 구글 캘린더에 넣어 주고 등록·수정·삭제를 그대로 반영한다.
//  3) 아직 연동 동의가 없으면 마이페이지로 보내지 않고 이 자리에서 동의 화면으로 보낸다.
//     동의가 끝나면 백엔드 콜백이 이 페이지(?calendar=linked)로 돌려보내고 첫 동기화가 이어진다.
//
// ICS 주소 구독(webcal)은 화면에서 뺐다. 주소(/api/event/calendar.ics) 자체는 이미 구독한 사람들이
// 쓰고 있으므로 백엔드에 그대로 남겨 둔다 — 없애면 그 사람들 캘린더 갱신이 끊긴다.
const CALENDAR_RESULT = {
  // 서버가 비동기로 넣어 주므로(실패 시 10분 간격 재시도) 캘린더에 보이기까지 시간이 걸린다
  linked: [
    'success',
    '구글 캘린더 구독이 시작됐어요. 동아리 일정이 내 캘린더에 보이기까지 최대 10분 정도 걸릴 수 있어요.',
  ],
  failed: ['error', '구글 캘린더 연동에 실패했어요. 잠시 후 다시 시도해주세요.'],
  cancelled: ['info', '구글 캘린더 연동을 취소했어요.'],
};

export default function CalendarSubscribeButton() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // 구글 캘린더 연동 상태. undefined = 조회 중, null = 조회 실패, 그 외 { linked, googleEmail, ... }
  const [status, setStatus] = useState(undefined);

  // 동의 화면에서 돌아온 결과 안내 (?calendar=linked|failed|cancelled). 읽은 뒤 쿼리는 지운다.
  // useSearchParams 대신 window.location 을 쓴다 — 마운트 직후 한 번만 필요한 값이고,
  // 훅을 쓰면 이 버튼을 품은 페이지 전체가 Suspense 경계를 요구하게 된다 (MyPageSection 과 같은 이유).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const entry = CALENDAR_RESULT[params.get('calendar')];
    if (!entry) return;

    toast[entry[0]](entry[1]);
    params.delete('calendar');
    const query = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));
  }, []);

  const handleOpen = async () => {
    setOpen(true);
    if (!isLoggedIn) return;
    setStatus(undefined);
    try {
      setStatus(await getCalendarLinkStatus());
    } catch {
      setStatus(null);
    }
  };

  // 동의 화면으로. 돌아올 곳을 함께 보내 콜백이 마이페이지가 아니라 이 캘린더 페이지로 돌려보내게 한다
  const startConsent = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const url = await getCalendarLinkUrl(ROUTES.CALENDAR);
      if (!url) throw new Error('authorizeUrl 없음');
      window.location.href = url;
    } catch {
      toast.error('구글 연동을 시작하지 못했어요. 잠시 후 다시 시도해주세요.');
      setBusy(false);
    }
  };

  const linked = !!status?.linked;
  const checking = isLoggedIn && status === undefined;

  let title;
  let description;
  if (!isLoggedIn) {
    title = '로그인이 필요해요';
    description = '동아리 일정을 내 구글 캘린더에 자동으로 넣어 드려요. 로그인한 뒤 다시 눌러주세요.';
  } else if (checking) {
    title = '연동 상태를 확인하는 중이에요…';
    description = '';
  } else if (linked) {
    title = '이미 구독 중이에요';
    description = `${status.googleEmail ? `${status.googleEmail} ` : ''}구글 캘린더에 새 일정·변경·삭제가 자동으로 반영돼요 (반영까지 최대 10분). 연동 관리는 마이페이지 → 정보 수정에서 할 수 있어요.`;
  } else {
    title = '구글 캘린더에 구독할까요?';
    // 계정 선택 화면에서 폰에 들어있는 구글 계정을 고르면 비밀번호·2단계 인증 없이 지나간다.
    // 새로 로그인하면 2단계 인증(숫자 맞추기)이 뜰 수 있는데, 그 숫자는 구글 로그인 화면에만 표시된다 — 미리 알려 둔다.
    description =
      '구글 계정 선택 화면이 열려요. 휴대폰에 등록된 구글 계정을 고르고 캘린더 권한을 허용하면 동아리 일정이 내 구글 캘린더에 자동 등록되고, 등록·수정·삭제가 그대로 반영돼요. 반영까지 최대 10분 정도 걸릴 수 있어요. 새로 로그인하다 2단계 인증 화면이 나오면 로그인 화면에 뜬 숫자를 휴대폰 알림에서 눌러주세요.';
  }

  const primaryBtn =
    'h-[48px] w-full rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242] disabled:opacity-60';
  const outlineBtn = 'h-[48px] w-full rounded-[4px] border-[#b9b9b9] text-[16px] text-[#212121]';

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-[8px] border border-[#E0E0E0] px-3 text-[13px] font-medium text-[#454545] transition hover:border-[#BDBDBD] hover:text-[#212121] sm:h-[40px] sm:px-4 sm:text-[14px]"
      >
        <CalendarPlus size={16} />내 캘린더에 구독
      </button>

      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent
          hideCloseButton
          className="max-w-[380px] gap-[20px] rounded-[4px] border-[#dedede] p-[24px]"
        >
          <DialogTitle className="text-center text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-[#212121] [word-break:keep-all]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-[14px] leading-[1.7] tracking-[-0.28px] text-[#454545] [word-break:keep-all]">
            {description}
          </DialogDescription>

          <DialogFooter className="flex flex-col gap-[8px] sm:flex-col sm:space-x-0">
            {!isLoggedIn ? (
              <Button
                type="button"
                onClick={() => router.push(loginUrlWithReturnTo(window.location.pathname))}
                className={primaryBtn}
              >
                로그인하기
              </Button>
            ) : linked ? (
              <Button type="button" onClick={() => setOpen(false)} className={primaryBtn}>
                확인
              </Button>
            ) : (
              <Button type="button" onClick={startConsent} disabled={checking || busy} className={primaryBtn}>
                {busy ? '구글로 이동 중…' : '구글로 연동하고 구독하기'}
              </Button>
            )}
            {!linked && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={busy}
                className={outlineBtn}
              >
                닫기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
