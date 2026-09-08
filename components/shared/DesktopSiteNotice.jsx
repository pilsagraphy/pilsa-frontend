'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * 휴대폰인데 PC 화면으로 그려질 때 띄우는 안내.
 *
 * 크롬 안드로이드의 "데스크톱 사이트" 모드가 켜지면 브라우저가 `<meta name="viewport">` 를 무시하고
 * 폭 980px 짜리 화면으로 그린 뒤 축소해 보여 준다. **사이트 쪽에서 되돌릴 방법이 없다** —
 * 미디어 쿼리에 980px 이 그대로 들어오고, 루트에 CSS `zoom` 을 걸어도 미디어 쿼리 값은 바뀌지 않는다
 * (Chrome 148 에서 확인). 앱(TWA)도 결국 크롬이 그리는 것이라 앱 설정으로 끌 수 있는 값이 아니다.
 * 그래서 감지해서 끄는 방법을 알려 주는 것이 할 수 있는 전부다.
 *
 * 판정 세 가지가 모두 참일 때만 뜬다:
 *  - `pointer: coarse` — 손가락 입력 기기 (마우스 쓰는 PC 는 여기서 걸러진다)
 *  - 레이아웃 폭 900px 이상 — 데스크톱 레이아웃이 실제로 적용된 상태
 *  - `visualViewport.scale < 0.8` — 화면보다 넓게 그려서 축소해 보여 주는 중
 * 진짜 태블릿은 축소되지 않아(scale ≈ 1) 걸리지 않고, 휴대폰에서 손가락으로 축소한 경우는
 * 레이아웃 폭이 그대로라 900px 을 넘지 않는다. PC 웹에서는 첫 조건에서 끝난다.
 */
const DISMISS_KEY = 'desktopSiteNoticeDismissed';

function isDesktopSiteMode() {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const scale = window.visualViewport?.scale ?? 1;
  return !!coarse && window.innerWidth >= 900 && scale < 0.8;
}

// 설치형 앱(TWA·홈 화면 앱)에는 주소창과 ⋮ 메뉴가 없어서 그 자리에서 끌 수 없다 — 안내가 달라야 한다
function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
}

export default function DesktopSiteNotice() {
  const [state, setState] = useState(null); // null = 숨김, { standalone } = 표시

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      // 저장소를 못 읽는 환경(시크릿 모드 등)에서는 그냥 판정만 한다
    }

    // 앱을 켜자마자 재는 값은 아직 확정 전일 수 있어 한 박자 뒤에 본다
    const timer = setTimeout(() => {
      if (isDesktopSiteMode()) setState({ standalone: isStandalone() });
    }, 700);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="fixed inset-x-0 top-0 z-[100] bg-[#212121] px-4 py-3 text-white">
      <div className="mx-auto flex max-w-[720px] items-start gap-3">
        <p className="flex-1 text-[13px] leading-[1.6] [word-break:keep-all]">
          <span className="font-semibold">PC 화면으로 보이고 있어요.</span>{' '}
          크롬의 <span className="font-medium">데스크톱 사이트</span> 모드가 켜져 있어서예요.
          <br />
          {state.standalone ? (
            <>
              크롬 앱을 열어 <span className="font-medium">⋮ → 설정 → 사이트 설정 → 데스크톱 사이트</span>를 끈 뒤
              이 앱을 다시 실행해주세요.
            </>
          ) : (
            <>
              오른쪽 위 <span className="font-medium">⋮</span> 에서{' '}
              <span className="font-medium">데스크톱 사이트</span> 체크를 해제하면 휴대폰 화면으로 돌아옵니다.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="안내 닫기"
          className="shrink-0 rounded-[4px] p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
