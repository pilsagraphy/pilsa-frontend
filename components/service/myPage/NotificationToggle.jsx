'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getAndroidHostBrowser, isIOS } from '@/lib/platform';
import {
  canShowPushToggle,
  getPushToggleState,
  enablePushOnThisDevice,
  disablePushOnThisDevice,
  isInstalledAndroidApp,
} from '@/lib/push';

// 브라우저 알림 설정 화면으로 데려다주는 앱 내부 주소 (TWA 앱의 BrowserNotificationSettingsActivity 가 받는다).
// 어느 브라우저인지는 여기서 알려 준다 — 앱은 Chrome 을 우선하지만 Chrome 이 없는 폰은 삼성 인터넷 등으로 열린다.
const browserNotificationSettingsIntent = (pkg, fallbackUrl) =>
  `intent://browser-notification?pkg=${encodeURIComponent(pkg)}` +
  '#Intent;scheme=pilsa;package=kr.co.pilsa.pilsagraphy;' +
  `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;

// "이 기기에서 알림 받기" 토글
// - 기기별 설정 (브라우저 구독 + 서버 기기 등록)으로 동작
// - 모바일 && 푸시 지원 환경에서만 노출. PC 웹은 알림함(종 아이콘)만 제공.
export default function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  // 설치형 안드로이드 앱일 때만 쓰는 값 — 화면을 그리는 브라우저 { name, pkg }
  const [hostBrowser, setHostBrowser] = useState(null);
  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const init = async () => {
      const visible = canShowPushToggle();
      setSupported(visible);
      setHostBrowser(isInstalledAndroidApp() ? getAndroidHostBrowser() : null);
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

      {/* 앱을 켜 두면 화면을 그리는 브라우저가 '○○에서 실행 중' 고지를 알림으로 띄운다.
          그 브라우저가 띄우는 알림이라 우리가 대신 끌 수는 없고(안드로이드가 막아 둔 영역),
          끄는 화면까지만 데려다준다. 아이폰에는 이런 고지가 없어 여기까지 오지 않는다 */}
      {hostBrowser && (
        <button
          type="button"
          onClick={() => {
            window.location.href = browserNotificationSettingsIntent(
              hostBrowser.pkg,
              window.location.href
            );
          }}
          className="mt-2.5 text-left text-[12px] leading-[1.5] tracking-[-0.02em] text-[#919191] underline underline-offset-2"
        >
          {hostBrowser.runningNotice
            ? `‘${hostBrowser.runningNotice}’ 알림 숨기기`
            : `${hostBrowser.name} 알림 설정 열기`}
        </button>
      )}
    </div>
  );
}
