'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/useAuthStore';
import AppLoading from '@/components/common/AppLoading';
import { loginUrlWithReturnTo, currentPathForReturn } from '@/lib/returnTo';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const { isLoggedIn, authChecked } = useAuthStore();

  useEffect(() => {
    if (!authChecked) return;
    if (!isLoggedIn) {
      // 보고 있던 경로를 들고 간다 — 알림 딥링크로 들어온 사람이 로그인 뒤 그 게시글로 돌아가게
      router.replace(loginUrlWithReturnTo(currentPathForReturn()));
    }
  }, [authChecked, isLoggedIn, router]);

  if (!authChecked) {
    return <AppLoading />;
  }

  if (!isLoggedIn) {
    return null;
  }

  return children;
}
