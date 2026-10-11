'use client';

import { useEffect } from 'react';
import useThemeStore, { applyTheme } from '@/stores/useThemeStore';

// 화면 모드 부트스트랩 — 마운트 때 저장값을 스토어에 올리고, '시스템 설정'이면 OS 가 바뀔 때 따라간다.
// 첫 페인트 전 적용은 app/layout.js 의 인라인 스크립트가 하고, 여기는 그 뒤의 동기화만 맡는다.
export default function ThemeBootstrap() {
  const hydrate = useThemeStore((s) => s.hydrate);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (theme !== 'system' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [theme]);

  return null;
}
