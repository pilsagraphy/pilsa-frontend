'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/stores/useAuthStore';
import { PUBLIC_ROUTES } from '@/constants/routes';

export default function AuthBootstrap({ children }) {
  const pathname = usePathname();
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (isPublicRoute) return;

    // 이미 인증 확인이 끝난 상태(로그인 직후 등)면 재실행하지 않음
    // → 로그인으로 세팅된 상태를 refresh 결과로 덮어쓰는 것을 방지
    if (useAuthStore.getState().authChecked) return;

    initializeAuth();
  }, [pathname, initializeAuth]);

  return children;
}
