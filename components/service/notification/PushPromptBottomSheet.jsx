'use client';

import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/stores/useAuthStore';
import {
  canShowPushToggle,
  isStandalone,
  enablePushOnThisDevice,
  getPushToggleState,
  getRestoreAfterLoginPromise,
} from '@/lib/push';

// 로그인 직후 1회 노출 신호
export const JUST_LOGGED_IN_KEY = 'pilsa:justLoggedIn';
// [나중에] 선택 기록: { laterAt: epoch ms, laterCount: number }
const PROMPT_STATE_KEY = 'pilsa:pushPromptState';
const RESHOW_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7일

// 알림 유도 팝업창
// 노출 조건: 모바일 && 알림 푸시 지원 && 어플리케이션(standalone) && 기기 미등록 && 권한이 denied 아님
//           && 웹앱 설치 후 첫 로그인 1회. [나중에] 선택 시 7일 뒤 1회만 재노출, 이후 침묵.
// 개발 환경에서는 ?pushPrompt=1 쿼리로 강제 노출 가능 (시연·QA용).
export default function PushPromptBottomSheet() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [visible, setVisible] = useState(false);
  const [enabling, setEnabling] = useState(false);

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
          if (Notification.permission === 'denied') return;

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
        toast.error('브라우저에서 알림이 차단되어 있어요');
        setVisible(false); // denied 상태에서는 더 이상 유도하지 않음
      } else {
        toast.error('알림 설정에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setEnabling(false);
    }
  };

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
