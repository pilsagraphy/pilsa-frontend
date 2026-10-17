'use client';

import { useEffect, useRef } from 'react';
import { getGooglePendingLink } from '@/apis/google';
import { ROUTES } from '@/constants/routes';

// 간편로그인 연결 대기(서버 보관 10분)가 끝났는지 지켜본다 — 소셜 가입 폼, 로그인해서 연결하기 화면에서 쓴다 (PM 2026-10-16).
// 만료를 모른 채 다 채우고 [가입]·[로그인]을 누르면 그제야 실패해서, 끝나는 즉시 로그인 화면을 새로 열고 팝업으로 알린다.
// 대기 조회(GET /api/auth/google/pending)는 꺼내 보기(peek)만 해서 여러 번 불러도 대기가 사라지지 않는다.
// 제공자와 상관없이 같은 보관함(g_pending_link)이라 구글 조회 하나로 네이버·카카오도 본다.
export const SOCIAL_EXPIRED_PARAM = 'socialExpired';
const POLL_MS = 30 * 1000;

export default function useSocialPendingExpiry(active) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active) return undefined;
    firedRef.current = false;

    const check = async () => {
      if (firedRef.current) return;
      try {
        const info = await getGooglePendingLink();
        if (info?.pending || firedRef.current) return;
        firedRef.current = true;
        // 화면 상태(입력값·모달)를 다 버리고 새로 연다 — 로그인 화면이 쿼리를 보고 만료 팝업을 띄운다
        window.location.replace(`${ROUTES.LOGIN}?${SOCIAL_EXPIRED_PARAM}=1`);
      } catch {
        // 네트워크 오류는 만료로 보지 않는다 — 다음 확인에서 다시 본다
      }
    };

    const timer = setInterval(check, POLL_MS);
    // 폰에서 다른 앱에 갔다 돌아오면 타이머가 멈춰 있었을 수 있다 — 돌아온 즉시 확인
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [active]);
}
