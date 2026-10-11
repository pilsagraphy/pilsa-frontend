import { create } from 'zustand';

// 화면 모드(다크모드) — 시스템 따름 / 라이트 / 다크 세 가지 (PM 2026-10-11 "다크모드 제대로").
// 저장은 localStorage 'pilsaTheme' 한 칸. 적용은 <html class="dark"> 토글이고, 색은 전부 globals.css 의 토큰(--c-*)이 바꾼다.
// 처음 그릴 때 깜빡이지 않도록 app/layout.js 의 인라인 스크립트가 같은 규칙으로 먼저 class 를 붙인다 — 규칙을 바꾸면 그쪽도 같이.
export const THEME_KEY = 'pilsaTheme';
export const THEMES = [
  { key: 'system', label: '시스템' },
  { key: 'light', label: '라이트' },
  { key: 'dark', label: '다크' },
];
const LIGHT_BAR = '#ffffff';
const DARK_BAR = '#121212';

const readSaved = () => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
};

export const resolveTheme = (theme) => {
  if (theme === 'light' || theme === 'dark') return theme;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// html 에 dark 클래스 + 폼 컨트롤 색(color-scheme) + 설치형 앱 상태바(theme-color) 를 한 번에 맞춘다
export const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  const dark = resolveTheme(theme) === 'dark';
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? DARK_BAR : LIGHT_BAR));
};

const useThemeStore = create((set) => ({
  theme: 'system',
  hydrated: false,
  // 마운트 뒤 저장값을 읽어 적용 (SSR 에서는 localStorage 가 없다)
  hydrate: () => {
    const theme = readSaved();
    applyTheme(theme);
    set({ theme, hydrated: true });
  },
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // 저장 못 해도 이번 세션엔 적용된다
    }
    applyTheme(theme);
    set({ theme });
  },
}));

export default useThemeStore;
