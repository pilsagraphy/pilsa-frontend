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

const PLACEHOLDER_TEXT = {
  bold: '굵은 텍스트',
  italic: '기울인 텍스트',
};

const HEADING_LEVEL = { heading: 2, h1: 1, h2: 2, h3: 3 };
const LIST_MARKER = /^(\s*)(?:[-*+]|\d+\.)\s+/;

// 커서가 놓인 줄의 시작·끝 (선택이 여러 줄이면 그 줄들 전부)
function lineRange(base, start, end) {
  const from = base.lastIndexOf('\n', start - 1) + 1;
  const toIndex = base.indexOf('\n', Math.max(end, start));
  const to = toIndex === -1 ? base.length : toIndex;
  return { from, to };
}

// 제목: 줄 맨 앞에 '# ' × level 을 붙인다. 같은 단계면 뗀다, 다른 단계면 바꾼다
function applyHeading(base, start, end, level) {
  const { from } = lineRange(base, start, start);
  const existing = /^(#{1,6})\s/.exec(base.slice(from));
  const marker = `${'#'.repeat(level)} `;

  if (existing) {
    const len = existing[0].length;
    const replacement = existing[1].length === level ? '' : marker;
    const delta = replacement.length - len;
    return {
      text: base.slice(0, from) + replacement + base.slice(from + len),
      selectionStart: Math.max(from + replacement.length, start + delta),
      selectionEnd: Math.max(from + replacement.length, end + delta),
    };
  }

  return {
    text: base.slice(0, from) + marker + base.slice(from),
    selectionStart: start + marker.length,
    selectionEnd: end + marker.length,
  };
}

// 목록: 선택한 줄마다 '- ' 또는 '1. 2. …' 를 붙인다. 이미 전부 목록이면 뗀다
function applyList(base, start, end, ordered) {
  const { from, to } = lineRange(base, start, end);
  const lines = base.slice(from, to).split('\n');
  const allListed = lines.every((line) => LIST_MARKER.test(line));

  const next = lines.map((line, index) => {
    if (allListed) return line.replace(LIST_MARKER, '$1');
    const stripped = line.replace(LIST_MARKER, '$1');
    return `${ordered ? `${index + 1}. ` : '- '}${stripped}`;
  });

  const block = next.join('\n');
  return {
    text: base.slice(0, from) + block + base.slice(to),
    // 다시 고를 때 줄 전체를 잡아 두면 이어서 다른 서식을 걸기 쉽다
    selectionStart: from,
    selectionEnd: from + block.length,
  };
}

// 툴바(제목/굵게/기울임/목록)가 본문에 서식을 적용한다.
// 선택한 글자가 있으면 그것을 감싸고, 없으면 예시 글자를 넣은 뒤 그 부분을 선택 상태로 돌려준다.
// 이미 적용돼 있으면 다시 눌러 해제한다.
//
// type: 'h1' | 'h2' | 'h3' | 'heading'(=h2) | 'bold' | 'italic' | 'ul' | 'ol'
// @returns {{ text: string, selectionStart: number, selectionEnd: number }}
export function applyInlineMarkdown(value, start, end, type) {
  const base = value ?? '';
  const selected = base.slice(start, end);

  if (HEADING_LEVEL[type]) {
    return applyHeading(base, start, end, HEADING_LEVEL[type]);
  }
  if (type === 'ul' || type === 'ol') {
    return applyList(base, start, end, type === 'ol');
  }

  const marker = type === 'bold' ? '**' : '*';
  const before = start >= marker.length ? base.slice(start - marker.length, start) : '';
  const after = base.slice(end, end + marker.length);

  // 이미 감싸져 있으면 벗긴다
  if (selected && before === marker && after === marker) {
    return {
      text: base.slice(0, start - marker.length) + selected + base.slice(end + marker.length),
      selectionStart: start - marker.length,
      selectionEnd: end - marker.length,
    };
  }

  const body = selected || PLACEHOLDER_TEXT[type] || '';
  return {
    text: base.slice(0, start) + marker + body + marker + base.slice(end),
    selectionStart: start + marker.length,
    selectionEnd: start + marker.length + body.length,
  };
}
