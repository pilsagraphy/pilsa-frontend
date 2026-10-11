import { defaultSchema } from 'rehype-sanitize';

// 게시글 본문(마크다운) 렌더링 관련 공통 설정.
//
// 본문에는 GitHub 처럼 raw HTML(<img width=... src=... />)이 섞여 들어온다.
// raw HTML 을 그대로 렌더하면 저장형 XSS 통로가 되므로 반드시 sanitize 를 함께 건다.
// (rehypeRaw → rehypeSanitize 순서로 적용해야 한다)
export const markdownSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // 이미지 크기 지정(<img width height />)을 허용한다 — 본문에 실제로 그렇게 들어온다
    img: [...(defaultSchema.attributes?.img ?? []), 'width', 'height', 'loading'],
    // 외부 링크를 새 탭으로 열 때 필요한 속성
    a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
    // 글자색·배경색(편집기가 <span style="color: …"> 로 저장). 값은 아래 pickColorStyle 이 다시 거른다 —
    // 허용 목록은 속성 이름만 보므로 position 같은 게 섞여 들어와도 여기서는 못 막는다
    span: [...(defaultSchema.attributes?.span ?? []), 'style'],
  },
};

// 색 값으로 믿을 수 있는 꼴만 통과시킨다: #hex · rgb()/rgba() · 색 이름
const COLOR_VALUE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i;

// 본문 <span style> 에서 글자색·배경색만 남긴다. 그 외(position, url() 등)는 전부 버린다
export function pickColorStyle(style) {
  if (!style || typeof style !== 'object') return undefined;
  const picked = {};
  if (COLOR_VALUE.test(String(style.color ?? ''))) picked.color = style.color;
  if (COLOR_VALUE.test(String(style.backgroundColor ?? ''))) picked.backgroundColor = style.backgroundColor;
  return Object.keys(picked).length > 0 ? picked : undefined;
}

// 붙여 넣은 글에 섞여 들어올 만한 색 이름 몇 가지 — 편집기 팔레트는 hex 만 쓰지만 워드·구글독스 복사본은 이름으로 온다
const NAMED_COLORS = {
  white: [255, 255, 255], black: [0, 0, 0], yellow: [255, 255, 0], lightyellow: [255, 255, 224], lemonchiffon: [255, 250, 205],
  gold: [255, 215, 0], orange: [255, 165, 0], pink: [255, 192, 203], lightpink: [255, 182, 193], red: [255, 0, 0],
  lime: [0, 255, 0], lightgreen: [144, 238, 144], green: [0, 128, 0], aqua: [0, 255, 255], cyan: [0, 255, 255],
  lightblue: [173, 216, 230], skyblue: [135, 206, 235], blue: [0, 0, 255], navy: [0, 0, 128], purple: [128, 0, 128],
  lavender: [230, 230, 250], violet: [238, 130, 238], magenta: [255, 0, 255], fuchsia: [255, 0, 255], gray: [128, 128, 128],
  grey: [128, 128, 128], lightgray: [211, 211, 211], lightgrey: [211, 211, 211], silver: [192, 192, 192], beige: [245, 245, 220],
  ivory: [255, 255, 240], khaki: [240, 230, 140], brown: [165, 42, 42], maroon: [128, 0, 0], teal: [0, 128, 128], olive: [128, 128, 0],
};

// 색 문자열(#rgb · #rrggbb · #rrggbbaa · rgb()/rgba() · 흔한 색 이름)의 상대 휘도(0~1).
// 반투명(알파 < 1)이면 실제 보이는 색을 알 수 없어 null, 7자리 hex 처럼 CSS 가 버리는 값도 null (검토 지적 10/11)
function luminanceOf(value) {
  const v = String(value ?? '')
    .trim()
    .toLowerCase();
  let r;
  let g;
  let b;
  const hex = /^#([0-9a-f]{3,8})$/.exec(v);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    if (h.length === 8 && parseInt(h.slice(6, 8), 16) < 255) return null;
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else if (NAMED_COLORS[v]) {
    [r, g, b] = NAMED_COLORS[v];
  } else {
    const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(v);
    if (!rgb) return null;
    if (rgb[4] !== undefined && Number(rgb[4]) < 1) return null;
    [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// 형광펜(배경색)만 있고 글자색은 안 고른 글자에 붙일 클래스 — 배경이 연하면 hl-light(다크모드에서 검정 글자),
// 진하면 hl-dark(늘 밝은 글자). 규칙은 globals.css. 글자색을 따로 골랐으면 그 색이 맞으니 아무것도 안 붙인다 (PM 10/11)
export function highlightClass(style) {
  const picked = pickColorStyle(style);
  if (!picked?.backgroundColor || picked.color) return undefined;
  const lum = luminanceOf(picked.backgroundColor);
  if (lum == null) return undefined;
  return lum > 0.35 ? 'hl-light' : 'hl-dark';
}

// 첨부/이미지 API 주소에서 fileId 를 뽑는다.
// 예: /api/user/files/31  ·  https://api.example.com/api/user/files/31
const FILE_URL_PATTERN = /\/api\/user\/files\/(\d+)/;

export function extractFileId(src) {
  if (!src) return null;
  const matched = String(src).match(FILE_URL_PATTERN);
  return matched ? matched[1] : null;
}
