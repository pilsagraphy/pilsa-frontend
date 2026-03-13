'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/useAuthStore';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const { isLoggedIn, authChecked } = useAuthStore();

  useEffect(() => {
    if (!authChecked) return;
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [authChecked, isLoggedIn, router]);

  if (!authChecked) {
    return <div>로딩 중...</div>;
  }

  if (!isLoggedIn) {
    return null;
  }

  return children;
}
