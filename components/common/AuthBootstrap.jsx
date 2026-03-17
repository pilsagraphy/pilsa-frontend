'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PUBLIC_ROUTES } from '@/constants/routes';

export default function AuthBootstrap({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (isPublicRoute) return;
  }, [pathname]);

  return children;
}