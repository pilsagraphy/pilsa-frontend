'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import useAuthStore, { AUTO_LOGIN_KEY } from '@/stores/useAuthStore';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { validateRefreshToken } from '@/apis/auth';

export default function AuthBootstrap({ children }) {
  const pathname = usePathname();
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const autoLoginTried = useRef(false);

  // 자동 로그인 설정된 경우 공개 경로에서도 앱 최초 진입 1회에 한해 refresh 쿠키로 세션을 복원
  useEffect(() => {
    if (autoLoginTried.current) return;
    autoLoginTried.current = true;

    if (!PUBLIC_ROUTES.includes(window.location.pathname)) return;

    // 로그아웃 진입(/login?logout=1)과의 경합 방지 — 로그아웃 처리 중 세션을 부활시키면 안 된다
    if (new URLSearchParams(window.location.search).get('logout') === '1') return;

    let wantsAutoLogin = false;
    try {
      wantsAutoLogin = localStorage.getItem(AUTO_LOGIN_KEY) === '1';
    } catch {
      wantsAutoLogin = false;
    }
    if (!wantsAutoLogin) return;

    const { isLoggedIn } = useAuthStore.getState();
    if (isLoggedIn) return;

    const tryAutoLogin = async () => {
      try {
        // 200 = refreshToken 쿠키 있음 / 204 = 없음
        const response = await validateRefreshToken();
        if (response?.status === 200) {
          await initializeAuth();
        }
      } catch {
        // 쿠키 만료 등 — 조용히 넘어가고 일반(비로그인) 상태 유지
      }
    };

    tryAutoLogin();
  }, [initializeAuth]);

  // 보호 경로 진입 시 세션 복원
  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (isPublicRoute) return;

    initializeAuth();
  }, [pathname, initializeAuth]);

  return children;
}
