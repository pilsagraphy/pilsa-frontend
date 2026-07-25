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

    initializeAuth();
  }, [pathname, initializeAuth]);

  return children;
}
