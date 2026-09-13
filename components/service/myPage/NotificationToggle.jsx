'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { isIOS } from '@/lib/platform';
import {
  canShowPushToggle,
  getPushToggleState,
  enablePushOnThisDevice,
  disablePushOnThisDevice,
  isInstalledAndroidApp,
} from '@/lib/push';

// 크롬 알림 설정 화면으로 데려다주는 앱 내부 주소 (TWA 앱의 ChromeNotificationSettingsActivity 가 받는다)
const CHROME_NOTIFICATION_SETTINGS_INTENT = (fallbackUrl) =>
  'intent://chrome-notification/#Intent;scheme=pilsa;package=kr.co.pilsa.pilsagraphy;' +
  `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;

// "이 기기에서 알림 받기" 토글
// - 기기별 설정 (브라우저 구독 + 서버 기기 등록)으로 동작
// - 모바일 && 푸시 지원 환경에서만 노출. PC 웹은 알림함(종 아이콘)만 제공.
export default function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [inAndroidApp, setInAndroidApp] = useState(false);
  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const init = async () => {
      const visible = canShowPushToggle();
      setSupported(visible);
      setInAndroidApp(isInstalledAndroidApp());
      if (!visible) {
        setLoading(false);
        return;
      }
      try {
        // 서버 기기 목록과 대조
        const { on: initialOn } = await getPushToggleState();
        setOn(initialOn);
      } catch {
        setOn(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleToggle = async () => {
    if (busy || loading) return;
    setBusy(true);
    try {
      if (on) {
        const result = await disablePushOnThisDevice();
        setOn(false);
        toast.success(result?.message ?? '이 기기에서는 알림을 받지 않습니다.');
      } else {
        // on=false인데 브라우저 구독이 남아있는 경우(서버 행 유실) 재등록하여 복구
        const result = await enablePushOnThisDevice();
        setOn(true);
        toast.success(result?.message ?? '이 기기로 알림을 받습니다.');
      }
    } catch (err) {
      if (err?.code === 'PERMISSION_DENIED') {
        // 설치형 앱은 OS 프롬프트를 한 번 거부하면 웹에서 다시 물을 수 없다 — 앱 설정에서 켜는 길을 알려준다
        toast.error(
          isInstalledAndroidApp()
            ? '앱 알림이 꺼져 있어요. 앱 아이콘을 길게 눌러 [앱 정보] → [알림]에서 켠 뒤 앱을 다시 열어주세요.'
            : isIOS()
              ? '알림이 꺼져 있어요. iPhone 설정 → 알림 → Pilsagraphy 에서 허용해 주세요.'
              : '브라우저에서 알림이 차단되어 있어요'
        );
      } else {
        toast.error('알림 설정에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setBusy(false);
    }
  };

  // PC 웹에서 토글은 렌더링하지 않음
  if (!supported) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-[1.5] tracking-[-0.02em] text-[#212121]">
            이 기기에서 알림 받기
          </p>
          <p className="mt-0.5 text-[12px] leading-[1.5] tracking-[-0.02em] text-[#919191]">
            새 댓글·답글이 달리면 알려드려요
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="이 기기에서 알림 받기"
          disabled={loading || busy}
          onClick={handleToggle}
          className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${
            on ? 'bg-[#212121]' : 'bg-[#D6D6D6]'
          }`}
        >
          <span
            className={`absolute left-[3px] top-[3px] size-5 rounded-full bg-white shadow transition-transform duration-200 ${
              on ? 'translate-x-[20px]' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 앱을 켜 두면 크롬이 'Chrome에서 실행 중' 고지를 알림으로 띄운다. 크롬이 띄우는 알림이라
          우리가 대신 끌 수는 없고(안드로이드가 막아 둔 영역), 끄는 화면까지만 데려다준다 */}
      {inAndroidApp && (
        <button
          type="button"
          onClick={() => {
            window.location.href = CHROME_NOTIFICATION_SETTINGS_INTENT(window.location.href);
          }}
          className="mt-2.5 text-left text-[12px] leading-[1.5] tracking-[-0.02em] text-[#919191] underline underline-offset-2"
        >
          &lsquo;Chrome에서 실행 중&rsquo; 알림 숨기기
        </button>
      )}
    </div>
  );
}
