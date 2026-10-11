/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        // ─── 다크모드 시맨틱 토큰 (2026-10-11) ───
        // 값은 app/globals.css 의 --c-* (RGB 세 숫자) 이고 .dark 에서 통째로 바뀐다. 코드에서는 hex 대신 이 이름만 쓴다:
        //   바탕: page(페이지) · surface(카드/모달/입력칸) · surface-2(옅은 회색 바탕) · surface-3(그 호버)
        //   선:   line(기본 #dedede) · line-strong(#b9b9b9)
        //   글자: ink(본문 #212121) · ink-2(#454545) · ink-3(#919191) · ink-4(#b9b9b9, 비활성·플레이스홀더)
        //   반전: inverse(검정 버튼 바탕) · inverse-2(배지) · inverse-hover · inverse-fg(그 위 글자)
        //   의미: danger(#b3261e, 삭제·오류) · danger-bg · alert(#f44336, 경고 글자) · link(#1a73e8) · highlight(급상승 노랑)
        page: 'rgb(var(--c-page) / <alpha-value>)',
        // 떠 있는 것(드롭다운·팝오버·바텀시트·말풍선) 바탕 — 라이트에선 흰색, 다크에선 page 보다 한 단계 밝다. surface 는 다크에서 page 와 같다
        elevated: 'rgb(var(--c-elevated) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
          2: 'rgb(var(--c-surface-2) / <alpha-value>)',
          3: 'rgb(var(--c-surface-3) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--c-line) / <alpha-value>)',
          strong: 'rgb(var(--c-line-strong) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          2: 'rgb(var(--c-ink-2) / <alpha-value>)',
          3: 'rgb(var(--c-ink-3) / <alpha-value>)',
          4: 'rgb(var(--c-ink-4) / <alpha-value>)',
        },
        inverse: {
          DEFAULT: 'rgb(var(--c-inverse) / <alpha-value>)',
          2: 'rgb(var(--c-inverse-2) / <alpha-value>)',
          hover: 'rgb(var(--c-inverse-hover) / <alpha-value>)',
          fg: 'rgb(var(--c-inverse-fg) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--c-danger) / <alpha-value>)',
          bg: 'rgb(var(--c-danger-bg) / <alpha-value>)',
        },
        alert: 'rgb(var(--c-alert) / <alpha-value>)',
        link: 'rgb(var(--c-link) / <alpha-value>)',
        highlight: 'rgb(var(--c-highlight) / <alpha-value>)',
        // 옛 이름 — Sidebar 등이 쓴다. 같은 토큰을 가리키게 해서 다크에서도 따라오게
        grayscale: {
          '01': 'rgb(var(--c-surface-2) / <alpha-value>)',
          '02': 'rgb(var(--c-line) / <alpha-value>)',
          '03': 'rgb(var(--c-line-strong) / <alpha-value>)',
          '04': 'rgb(var(--c-ink-3) / <alpha-value>)',
          '05': 'rgb(var(--c-ink-2) / <alpha-value>)',
          '06': 'rgb(var(--c-ink) / <alpha-value>)',
        },
      },
      // 사이트 기본 글꼴. body 에 font-sans 를 걸어 두므로 font-['Pretendard'] 를 일일이 붙이지 않아도 된다
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          'sans-serif',
        ],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      screens: {
        // 'mobile'은 기본(0px 이상)이므로 보통 320px부터 시작한다고 가정합니다.
        tablet: '768px', // => @media (min-width: 768px) { ... }
        desktop: '1024px', // => @media (min-width: 1024px) { ... }
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
