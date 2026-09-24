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

// 첨부/이미지 API 주소에서 fileId 를 뽑는다.
// 예: /api/user/files/31  ·  https://api.example.com/api/user/files/31
const FILE_URL_PATTERN = /\/api\/user\/files\/(\d+)/;

export function extractFileId(src) {
  if (!src) return null;
  const matched = String(src).match(FILE_URL_PATTERN);
  return matched ? matched[1] : null;
}
