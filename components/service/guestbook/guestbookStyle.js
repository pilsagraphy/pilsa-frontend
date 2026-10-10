import { Gaegu, Gamja_Flower, Hi_Melody, Nanum_Brush_Script, Nanum_Pen_Script, Poor_Story } from 'next/font/google';

// 방명록 꾸밈 규칙 (PM 2026-10-10, 밤에 손봄): 손글씨체 6종 · 잉크 6색(만년필 잉크 느낌) · 종이 4종(종류마다 바탕색이 다르고
// 무지에는 잉크 자국) · 정렬 3종. 스티커는 작성자가 그림판에서 직접 그린 투명 PNG 를 원하는 자리에 붙인다.
// 카드는 서버가 준 tilt(도)만큼 기울어져 손으로 붙인 듯 보인다.
const pen = Nanum_Pen_Script({ weight: '400', subsets: ['latin'], display: 'swap' });
const brush = Nanum_Brush_Script({ weight: '400', subsets: ['latin'], display: 'swap' });
const gaegu = Gaegu({ weight: '400', subsets: ['latin'], display: 'swap' });
const himelody = Hi_Melody({ weight: '400', subsets: ['latin'], display: 'swap' });
const gamja = Gamja_Flower({ weight: '400', subsets: ['latin'], display: 'swap' });
const poor = Poor_Story({ weight: '400', subsets: ['latin'], display: 'swap' });

// scale: 글꼴마다 같은 px 에서 보이는 크기가 달라 맞춰 준다
export const FONTS = [
  { key: 'pen', label: '나눔 펜', className: pen.className, scale: 1 },
  { key: 'brush', label: '나눔 붓', className: brush.className, scale: 1.05 },
  { key: 'gaegu', label: '개구', className: gaegu.className, scale: 0.9 },
  { key: 'himelody', label: '하이멜로디', className: himelody.className, scale: 0.9 },
  { key: 'gamja', label: '감자꽃', className: gamja.className, scale: 0.95 },
  { key: 'poor', label: '푸어스토리', className: poor.className, scale: 0.95 },
];

export const INKS = [
  { key: 'black', label: '검정', color: '#1f1f1f' },
  { key: 'blueblack', label: '블루블랙', color: '#1e3a5f' },
  { key: 'sepia', label: '세피아', color: '#5c3d1e' },
  { key: 'burgundy', label: '버건디', color: '#7a2e3b' },
  { key: 'forest', label: '초록', color: '#2f5d3a' },
  { key: 'pencil', label: '연필', color: '#8d8d8d' },
];

export const PAPERS = [
  { key: 'plain', label: '무지', bg: '#fffdf8', blot: true },
  { key: 'lined', label: '줄노트', bg: '#f7f9fb', lines: true },
  { key: 'grid', label: '모눈', bg: '#f6f8f5', grid: true },
  { key: 'cream', label: '크림', bg: '#f8f1e1' },
];

export const ALIGNS = [
  { key: 'left', label: '왼쪽' },
  { key: 'center', label: '가운데' },
  { key: 'right', label: '오른쪽' },
];

// 메모판 바탕 — 어느 쪽이 나은지 보려고 임시로 셋을 둔다 (/guestbook 크림, /guestbook/test-gray, /guestbook/test-white)
export const BOARD_THEMES = {
  cream: { bg: '#f6f4ee', dot: '#d6d3c9', border: '#e6e3db' },
  gray: { bg: '#f0f0f0', dot: '#cfcfcf', border: '#e0e0e0' },
  white: { bg: '#ffffff', dot: '#dadada', border: '#e8e8e8' },
};

// 줄노트는 줄 간격(28px)을 글 줄 높이와 똑같이 맞춰야 글이 줄 위에 앉는다
export const LINE_HEIGHT_PX = 28;

export const fontOf = (key) => FONTS.find((f) => f.key === key) ?? FONTS[0];
export const inkColor = (key) => (INKS.find((i) => i.key === key) ?? INKS[0]).color;
export const paperOf = (key) => PAPERS.find((p) => p.key === key) ?? PAPERS[0];

// 종이 바탕 스타일 — 종류마다 색이 다르고 줄노트·모눈은 선을 그린다 (스크롤해도 글과 같이 움직이게 local)
export const paperStyle = (key) => {
  const p = paperOf(key);
  const style = { backgroundColor: p.bg };
  if (p.lines) {
    style.backgroundImage = `repeating-linear-gradient(transparent 0 ${LINE_HEIGHT_PX - 1}px, #dde3ea ${LINE_HEIGHT_PX - 1}px ${LINE_HEIGHT_PX}px)`;
    style.backgroundAttachment = 'local';
  } else if (p.grid) {
    style.backgroundImage =
      'linear-gradient(to right, #e1e6df 1px, transparent 1px), linear-gradient(to bottom, #e1e6df 1px, transparent 1px)';
    style.backgroundSize = '14px 14px';
    style.backgroundAttachment = 'local';
  }
  return style;
};

export const textAlignOf = (key) => (ALIGNS.some((a) => a.key === key) ? key : 'left');
