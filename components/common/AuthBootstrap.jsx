'use client';

import { useEffect } from 'react';
import useAuthStore from '@/stores/useAuthStore';

export default function AuthBootstrap({ children }) {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return children;
}
