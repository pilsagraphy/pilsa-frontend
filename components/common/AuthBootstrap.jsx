'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import useAuthStore, { AUTO_LOGIN_KEY } from '@/stores/useAuthStore';
import { PUBLIC_ROUTES, ROUTES } from '@/constants/routes';
import { validateRefreshToken } from '@/apis/auth';
import { restorePushAfterLogin, watchPushPermissionRecovery } from '@/lib/push';

export default function AuthBootstrap({ children }) {
  const pathname = usePathname();
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const autoLoginTried = useRef(false);
  const pushRestored = useRef(false);

  // 자동 로그인 설정된 경우 공개 경로에서도 앱 최초 진입 1회에 한해 refresh 쿠키로 세션을 복원
  useEffect(() => {
    if (autoLoginTried.current) return;
    autoLoginTried.current = true;

    // 게이트(/)도 포함한다 — 설치형 앱은 켤 때마다 게이트(/?launch=app)에서 첫 마운트되므로, 여기서 시도하지 않으면
    // 앱을 켤 때마다 로그아웃 상태로 보이고 알림 재구독(restorePushAfterLogin)도 돌지 않는다. 보호 경로는 아래 effect 가 맡는다.
    const path = window.location.pathname;
    if (!PUBLIC_ROUTES.includes(path) && path !== ROUTES.GATE) return;

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

    // 이미 인증 확인이 끝난 상태(로그인 직후 등)면 재실행하지 않음
    // → 로그인으로 세팅된 상태를 refresh 결과로 덮어쓰는 것을 방지
    if (useAuthStore.getState().authChecked) return;

    initializeAuth();
  }, [pathname, initializeAuth]);

  // 세션이 살아난 뒤 알림 기기 등록 상태를 맞춘다.
  // 로그인 폼(LoginSection)에서만 부르면 자동 로그인으로 들어온 사람은 이 과정을 건너뛴다 —
  // 크롬이 푸시 구독을 갱신해 endpoint 가 바뀌면 다시 등록할 기회가 없어 알림이 조용히 끊긴다.
  // 권한 없음 · 사용자가 직접 끔 · 이미 등록됨은 restorePushAfterLogin 이 걸러내므로 여기서는 부르기만 한다.
  useEffect(() => {
    if (!isLoggedIn || pushRestored.current) return;
    pushRestored.current = true;
    restorePushAfterLogin();
  }, [isLoggedIn]);

  // 앱으로 돌아왔을 때 알림 권한이 살아났으면 등록 — OS 설정에서 알림을 켜고 돌아온 사람의 복구 경로
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    return watchPushPermissionRecovery();
  }, [isLoggedIn]);

  return children;
}
