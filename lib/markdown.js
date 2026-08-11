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
  },
};

// 첨부/이미지 API 주소에서 fileId 를 뽑는다.
// 예: /api/user/files/31  ·  https://api.example.com/api/user/files/31
const FILE_URL_PATTERN = /\/api\/user\/files\/(\d+)/;

export function extractFileId(src) {
  if (!src) return null;
  const matched = String(src).match(FILE_URL_PATTERN);
  return matched ? matched[1] : null;
}

// 업로드가 끝나기 전 본문에 넣어두는 자리표시자 (GitHub 방식).
// 업로드가 끝나면 이 문자열을 서버가 준 markdown 으로 교체한다.
export function uploadPlaceholder(fileName) {
  return `![Uploading ${fileName}…]()`;
}
