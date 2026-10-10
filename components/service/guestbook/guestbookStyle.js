import { Gaegu, Gamja_Flower, Hi_Melody, Nanum_Brush_Script, Nanum_Pen_Script, Poor_Story } from 'next/font/google';

// 방명록 꾸밈 규칙 (PM 2026-10-10, 밤에 손봄): 손글씨체 6종 · 잉크 6색(만년필 잉크 느낌) + 컬러피커 · 종이 5종(종류마다 바탕색이 다르고
// 무지에는 잉크 자국, 빈티지에는 커피 자국) · 정렬 3종. 스티커는 작성자가 그림판에서 직접 그린 투명 PNG 를 원하는 자리에 붙인다.
// 카드는 새로고침마다 일정 범위에서 랜덤하게 기울어져 손으로 붙인 듯 보인다.
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

// 줄노트는 살짝 파랑, 모눈은 살짝 초록 기운 (PM 10/10 밤 "그게 좋았는데")
export const PAPERS = [
  { key: 'plain', label: '무지', bg: '#fffdf8', marks: 'ink' },
  { key: 'lined', label: '줄노트', bg: '#f7f9fb', lines: true, lineColor: '#d7dfe8' },
  { key: 'grid', label: '모눈', bg: '#f6f8f5', grid: true, lineColor: '#dde4da' },
  { key: 'cream', label: '크림', bg: '#f8f1e1' },
  // 빈티지 — 바랜 종이(연하게)에 커피 자국. 가장자리는 살짝 그을린 듯
  { key: 'vintage', label: '빈티지', bg: '#f1e9d4', marks: 'coffee', vintage: true },
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

// 글 줄 높이 = 글자 크기의 배수. 줄노트의 줄도 같은 em 간격으로 그려 글씨체가 바뀌면 줄 간격도 따라가고,
// 페이지 확대·축소에도 글과 줄이 같이 움직인다 (px 고정이었을 때 줄 수가 달라지던 문제, PM 10/10 밤)
export const LINE_HEIGHT_EM = 1.3;
// 작성 칸과 카드가 똑같이 보이도록 카드는 이 폭으로 그린 뒤 칸 폭에 맞춰 축소한다 (스티커 위치가 어긋나던 원인, PM 10/10 밤)
export const DESIGN_WIDTH = 320;
export const BASE_FONT_PX = 22;

export const fontOf = (key) => FONTS.find((f) => f.key === key) ?? FONTS[0];
// 기본 6색 키 또는 사용자가 컬러피커로 고른 #rrggbb
export const inkColor = (key) => (typeof key === 'string' && /^#[0-9a-fA-F]{6}$/.test(key) ? key : (INKS.find((i) => i.key === key) ?? INKS[0]).color);
export const paperOf = (key) => PAPERS.find((p) => p.key === key) ?? PAPERS[0];

// 종이(카드) 바탕 — 종류마다 색이 다르고 모눈은 격자. 줄노트의 줄은 글 블록(textStyle)에 그린다
export const paperStyle = (key) => {
  const p = paperOf(key);
  const style = { backgroundColor: p.bg };
  if (p.vintage) {
    style.backgroundImage = 'radial-gradient(ellipse at 45% 40%, #f8f2e2 0%, #f1e9d4 60%, #e4d9bd 100%)';
    style.boxShadow = 'inset 0 0 22px rgba(92, 61, 30, 0.2), 2px 3px 0 rgba(0,0,0,0.05)';
  } else if (p.grid) {
    style.backgroundImage = `linear-gradient(to right, ${p.lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${p.lineColor} 1px, transparent 1px)`;
    style.backgroundSize = '14px 14px';
    style.backgroundAttachment = 'local';
  }
  return style;
};

// 글 블록(p · textarea) 스타일 — 글자 크기는 글씨체 배율, 줄 높이는 em, 줄노트면 em 간격의 줄
export const textStyle = (paperKey, fontKey, color, align) => {
  const p = paperOf(paperKey);
  const f = fontOf(fontKey);
  const style = {
    color,
    fontSize: `${Math.round(BASE_FONT_PX * f.scale)}px`,
    lineHeight: LINE_HEIGHT_EM,
    textAlign: align,
  };
  if (p.lines) {
    style.backgroundImage = `repeating-linear-gradient(transparent 0 calc(${LINE_HEIGHT_EM}em - 1px), ${p.lineColor} calc(${LINE_HEIGHT_EM}em - 1px) ${LINE_HEIGHT_EM}em)`;
    style.backgroundAttachment = 'local';
  }
  return style;
};

export const textAlignOf = (key) => (ALIGNS.some((a) => a.key === key) ? key : 'left');

// 카드 기울기 — 새로고침마다 랜덤. 대부분 2~5도(양쪽), 넷 중 하나는 거의 똑바로 (PM 10/10 밤)
export const randomTilt = () => {
  if (Math.random() < 0.25) return Math.round((Math.random() * 2 - 1) * 10) / 10;
  const t = 2 + Math.random() * 3;
  return Math.round((Math.random() < 0.5 ? -t : t) * 10) / 10;
};
