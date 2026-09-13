'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Share, Smartphone } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { isIOS } from '@/lib/platform';
import { isStandalone } from '@/lib/push';

/**
 * 아이폰으로 사이트 링크를 열고 들어온 사람에게 "홈 화면에 추가" 설치법을 안내한다.
 *
 * 아이폰은 Play 스토어처럼 내려받는 앱이 없다 — Safari 의 **홈 화면에 추가**가 곧 설치이고, 그렇게 설치한 앱에서만
 * (iOS 16.4+) 새 댓글·답글 알림(웹푸시)을 받을 수 있다. 설치 뒤 흐름(로그인 → 알림 유도 바텀시트 → 권한 → 구독)은
 * 안드로이드 앱과 같다 — lib/push.js 가 iOS 홈 화면 앱도 standalone 으로 본다.
 *
 * 노출: iOS && 설치형(standalone)이 아님 && 게이트(/)·관리자 화면이 아님. 닫으면 이 브라우저 탭(세션)에서는 다시 안 뜬다.
 * 카카오톡·인스타그램 등 앱 속 브라우저에는 '홈 화면에 추가'가 없어 Safari 로 다시 열라는 안내를 먼저 붙인다.
 */
const DISMISS_KEY = 'pilsa:iosInstallGuideDismissed';
const IN_APP_BROWSER = /KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp|Line\//i;

export default function IosInstallGuide() {
  const pathname = usePathname();
  const [state, setState] = useState(null); // null = 숨김, { inApp } = 표시

  useEffect(() => {
    if (!isIOS() || isStandalone()) return;
    if (pathname === ROUTES.GATE || pathname.startsWith(ROUTES.ADMIN_HOME)) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      // 저장소를 못 읽는 환경 — 그냥 판정만 한다
    }
    setState({ inApp: IN_APP_BROWSER.test(navigator.userAgent) });
  }, [pathname]);

  if (!state) return null;

  const dismiss = () => {
    setState(null);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // 저장 실패해도 이번 화면에서는 닫힌다
    }
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" onClick={dismiss} />

      {/* 바텀시트 — 알림 유도 바텀시트(PushPromptBottomSheet)와 같은 틀 */}
      <div className="fixed inset-x-0 bottom-0 z-[90] mx-auto max-w-[480px] rounded-t-[20px] bg-white px-6 pb-8 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#E0E0E0]" />

        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[#F5F5F5]">
            <Smartphone size={28} className="text-[#212121]" />
          </span>
          <h3 className="text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-black">
            Pilsagraphy 앱으로 설치하기
          </h3>
          <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#757575] [word-break:keep-all]">
            아이폰은 앱스토어 대신 <b>홈 화면에 추가</b>로 설치해요.
            <br />
            설치한 앱에서 로그인하면 새 댓글·답글 알림도 받을 수 있어요.
          </p>
        </div>

        {state.inApp && (
          <p className="mt-4 rounded-[8px] bg-[#FFF7E6] px-3 py-2.5 text-[13px] leading-[1.6] tracking-[-0.26px] text-[#8A5A00] [word-break:keep-all]">
            지금은 카카오톡 등 앱 안의 브라우저로 열려 있어 설치할 수 없어요. 오른쪽 아래 <b>⋯</b>(또는 공유)에서{' '}
            <b>Safari로 열기</b>를 누른 뒤 아래 순서대로 진행해 주세요.
          </p>
        )}

        <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-left text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545] [word-break:keep-all]">
          <li>
            화면 아래(또는 위)의 공유 버튼{' '}
            <Share size={15} className="inline-block align-[-2px] text-[#212121]" aria-label="공유" /> 을 누르고
          </li>
          <li>
            <b>홈 화면에 추가</b>를 선택한 뒤
          </li>
          <li>
            오른쪽 위 <b>추가</b> — 홈 화면에 생긴 Pilsagraphy 아이콘으로 열면 끝!
          </li>
        </ol>
        <p className="mt-3 text-[12px] leading-[1.6] tracking-[-0.24px] text-[#919191]">
          알림은 iOS 16.4 이상에서 받을 수 있어요.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="h-[52px] w-full rounded-[8px] bg-[#212121] text-[16px] font-semibold text-white transition hover:bg-black"
          >
            확인
          </button>
        </div>
      </div>
    </>
  );
}
