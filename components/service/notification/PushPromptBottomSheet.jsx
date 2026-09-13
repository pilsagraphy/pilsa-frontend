'use client';

import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/stores/useAuthStore';
import { isIOS } from '@/lib/platform';
import {
  canShowPushToggle,
  isStandalone,
  isInstalledAndroidApp,
  enablePushOnThisDevice,
  getPushToggleState,
  getRestoreAfterLoginPromise,
} from '@/lib/push';

// 로그인 직후 1회 노출 신호
export const JUST_LOGGED_IN_KEY = 'pilsa:justLoggedIn';
// [나중에] 선택 기록: { laterAt: epoch ms, laterCount: number }
const PROMPT_STATE_KEY = 'pilsa:pushPromptState';
const RESHOW_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7일
// 권한 거부 안내를 마지막으로 보여준 시각 (epoch ms) — 7일에 한 번만
const DENIED_GUIDE_AT_KEY = 'pilsa:pushDeniedGuideAt';

// 설치형 앱에서 OS 알림 프롬프트를 거부한 사람 — 웹에서는 다시 물을 수 없으니(권한이 denied 로 고정) 안내만 할 수 있다.
// 앱을 켤 때마다 뜨면 잔소리라 7일에 한 번만.
function shouldShowDeniedGuide() {
  try {
    const at = Number(localStorage.getItem(DENIED_GUIDE_AT_KEY) || 0);
    return Date.now() - at >= RESHOW_AFTER_MS;
  } catch {
    return true;
  }
}

function markDeniedGuideShown() {
  try {
    localStorage.setItem(DENIED_GUIDE_AT_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

// 알림 유도 팝업창
// 노출 조건: 모바일 && 알림 푸시 지원 && 어플리케이션(standalone) && 기기 미등록 && 권한이 denied 아님
//           && 웹앱 설치 후 첫 로그인 1회. [나중에] 선택 시 7일 뒤 1회만 재노출, 이후 침묵.
// 예외: 설치형 안드로이드 앱에서 권한이 denied 면(OS 프롬프트 거부로 앱이 영구 BLOCK 보고) 켜기 대신 "설정에서 켜는 법" 안내를 7일에 한 번 보여준다.
// 개발 환경에서는 ?pushPrompt=1 쿼리로 강제 노출 가능 (시연·QA용).
export default function PushPromptBottomSheet() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [visible, setVisible] = useState(false);
  const [enabling, setEnabling] = useState(false);
  // 'enable' = 알림 켜기 유도 / 'denied' = 설치형 앱에서 OS 권한이 거부돼 설정에서 켜야 하는 경우의 안내
  const [mode, setMode] = useState('enable');

  useEffect(() => {
    // 개발 환경 강제 노출(?pushPrompt=1)은 로그인 게이트까지 우회 — 시안 확인·QA용
    const forceShow =
      process.env.NODE_ENV === 'development' &&
      new URLSearchParams(window.location.search).get('pushPrompt') === '1';

    if (!isLoggedIn && !forceShow) return;

    const decide = async () => {
      try {
        if (!forceShow) {
          // 기능 노출 판별 — 화면 폭이 아니라 기기/환경으로
          if (!(canShowPushToggle() && isStandalone())) return;
          if (Notification.permission === 'denied') {
            // 설치형 앱(TWA)에서 '알림 켜기' 의 OS 프롬프트를 거부하면 앱이 영구 BLOCK 을 보고해 denied 로 고정된다.
            // 웹에서는 다시 물을 수 없어 안내만 — 브라우저 홈 화면 앱은 브라우저 설정 문제라 예전처럼 조용히 넘어간다
            if (!isInstalledAndroidApp() || !shouldShowDeniedGuide()) return;
            markDeniedGuideShown();
            setMode('denied');
            setVisible(true);
            return;
          }

          // 첫 로그인 1회 or 7일 뒤 재노출 판정
          const justLoggedIn = sessionStorage.getItem(JUST_LOGGED_IN_KEY) === '1';
          const stateRaw = localStorage.getItem(PROMPT_STATE_KEY);
          const state = stateRaw ? JSON.parse(stateRaw) : null;

          if (state?.laterCount >= 2) return; // 두 번 미뤘으면 이후 침묵
          if (state?.laterCount === 1) {
            if (Date.now() - state.laterAt < RESHOW_AFTER_MS) return; // 7일 경과 전
          } else if (!justLoggedIn) {
            return; // 첫 로그인 진입이 아닐 때는 노출하지 않음
          }

          // 로그인 직후 자동 복구(restorePushAfterLogin)가 진행 중이면 대기, 끝난 뒤의 서버 상태로 판정
          await getRestoreAfterLoginPromise();

          // 이미 이 기기가 등록돼 있으면 노출하지 않음
          const { on } = await getPushToggleState();
          if (on) return;
        }

        sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
        setMode('enable');
        setVisible(true);
      } catch {
        // 판정 실패 시 노출하지 않음
      }
    };

    decide();
  }, [isLoggedIn]);

  if (!visible) return null;

  const recordLater = () => {
    try {
      const stateRaw = localStorage.getItem(PROMPT_STATE_KEY);
      const state = stateRaw ? JSON.parse(stateRaw) : { laterCount: 0 };
      localStorage.setItem(
        PROMPT_STATE_KEY,
        JSON.stringify({ laterAt: Date.now(), laterCount: (state.laterCount ?? 0) + 1 })
      );
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const handleEnable = async () => {
    setEnabling(true);
    try {
      // 반드시 클릭 핸들러 안에서 권한 요청
      const result = await enablePushOnThisDevice();
      toast.success(result?.message ?? '이 기기로 알림을 받습니다.');
      setVisible(false);
    } catch (err) {
      if (err?.code === 'PERMISSION_DENIED') {
        toast.error(
          isInstalledAndroidApp()
            ? '앱 알림이 꺼져 있어요. 앱 아이콘을 길게 눌러 [앱 정보] → [알림]에서 켠 뒤 앱을 다시 열어주세요.'
            : isIOS()
              ? '알림이 꺼져 있어요. iPhone 설정 → 알림 → Pilsagraphy 에서 허용해 주세요.'
              : '브라우저에서 알림이 차단되어 있어요'
        );
        setVisible(false); // denied 상태에서는 더 이상 유도하지 않음
      } else {
        toast.error('알림 설정에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setEnabling(false);
    }
  };

  if (mode === 'denied') {
    // 권한 거부 안내 — 같은 바텀시트 틀에 문구만 다르다. 켜기 버튼은 두지 않는다(요청해도 즉시 denied 로 돌아온다)
    const close = () => setVisible(false);
    return (
      <>
        <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" onClick={close} />
        <div className="fixed inset-x-0 bottom-0 z-[90] mx-auto max-w-[480px] rounded-t-[20px] bg-white px-6 pb-8 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#E0E0E0]" />

          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-[#F5F5F5]">
              <BellRing size={28} className="text-[#212121]" />
            </span>
            <h3 className="text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-black">
              알림이 꺼져 있어요
            </h3>
            <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#757575] [word-break:keep-all]">
              휴대폰 설정에서 Pilsagraphy 앱의 알림이 꺼져 있어
              <br />새 댓글·답글 알림을 받을 수 없어요.
            </p>
          </div>

          <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-left text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545] [word-break:keep-all]">
            <li>
              홈 화면의 앱 아이콘을 길게 눌러 <b>앱 정보</b>
            </li>
            <li>
              <b>알림</b> → <b>알림 허용</b>을 켜기
            </li>
            <li>앱을 완전히 닫았다가 다시 열기 (바로 반영되지 않으면 휴대폰을 껐다 켜기)</li>
          </ol>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={close}
              className="h-[52px] w-full rounded-[8px] bg-[#212121] text-[16px] font-semibold text-white transition hover:bg-black"
            >
              확인
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" onClick={recordLater} />

      {/* 바텀시트 */}
      <div className="fixed inset-x-0 bottom-0 z-[90] mx-auto max-w-[480px] rounded-t-[20px] bg-white px-6 pb-8 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#E0E0E0]" />

        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[#F5F5F5]">
            <BellRing size={28} className="text-[#212121]" />
          </span>
          <h3 className="text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-black">
            새 댓글·답글 알림을 받아보세요
          </h3>
          <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#757575] [word-break:keep-all]">
            내 글에 댓글이 달리거나 내 댓글에 답글이 달리면
            <br />이 기기로 바로 알려드릴게요.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={enabling}
            onClick={handleEnable}
            className="h-[52px] w-full rounded-[8px] bg-[#212121] text-[16px] font-semibold text-white transition hover:bg-black disabled:opacity-60"
          >
            {enabling ? '설정 중...' : '알림 켜기'}
          </button>
          <button
            type="button"
            onClick={recordLater}
            className="h-[44px] w-full rounded-[8px] text-[15px] font-medium text-[#919191] transition hover:text-[#454545]"
          >
            나중에
          </button>
        </div>
      </div>
    </>
  );
}
