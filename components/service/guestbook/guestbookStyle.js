import { Nanum_Pen_Script } from 'next/font/google';

// 방명록 꾸밈 규칙 (PM 2026-10-10): 색 포스트잇이 아니라 무채색 — 잉크 · 만년필 · 문구류 느낌.
// 글씨는 손글씨체(나눔손글씨 펜), 종이는 흰색/크림/줄노트 세 가지, 잉크는 검정/연한 잉크/연필 세 가지.
// 카드는 서버가 준 tilt(도)만큼 살짝 기울어져 손으로 붙인 듯 보인다.
export const penFont = Nanum_Pen_Script({ weight: '400', subsets: ['latin'], display: 'swap' });

export const INKS = [
  { key: 'ink', label: '잉크', color: '#1f1f1f' },
  { key: 'gray', label: '연한 잉크', color: '#5c5c5c' },
  { key: 'pencil', label: '연필', color: '#8d8d8d' },
];

export const PAPERS = [
  { key: 'plain', label: '민무늬', className: 'bg-white' },
  { key: 'cream', label: '크림', className: 'bg-[#faf7ef]' },
  { key: 'lined', label: '줄노트', className: 'bg-white' },
];

// 줄노트는 줄 간격(28px)을 글 줄 높이와 똑같이 맞춰야 글이 줄 위에 앉는다
export const LINE_HEIGHT_PX = 28;
export const linedStyle = {
  backgroundImage: `repeating-linear-gradient(transparent 0 ${LINE_HEIGHT_PX - 1}px, #e4e1d8 ${LINE_HEIGHT_PX - 1}px ${LINE_HEIGHT_PX}px)`,
  backgroundAttachment: 'local',
};

export const inkColor = (key) => INKS.find((i) => i.key === key)?.color ?? INKS[0].color;
export const paperClass = (key) => PAPERS.find((p) => p.key === key)?.className ?? PAPERS[0].className;

// 스티커 자리 — 고른 순서대로 오른쪽 위 → 왼쪽 아래 → 오른쪽 아래. 살짝 돌려 붙인다
export const STICKER_SLOTS = [
  { className: '-right-3 -top-4', rotate: 8 },
  { className: '-left-3 -bottom-3', rotate: -7 },
  { className: '-right-2 -bottom-4', rotate: 12 },
];
