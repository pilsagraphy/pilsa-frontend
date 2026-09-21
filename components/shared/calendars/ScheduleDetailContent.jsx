'use client';

import { apiUrl } from '@/lib/apiBase';

// 세부 내용은 여러 줄 문자열 하나로 들어온다.
// '-' · '•' · '*'로 시작하는 줄은 목록 항목으로 보고, 앞의 공백 2칸(탭 1개)마다 한 단계 들여쓴다.
// 디자인 시안이 2단계까지만 쓰므로 깊이도 1까지만 인정한다.
const INDENT_SIZE = 2;
const MAX_DEPTH = 1;
const BULLET_PATTERN = /^[-•*]\s+/;

function parseLines(content) {
  return String(content)
    .split('\n')
    .map((line) => {
      const text = line.trim();
      if (!text) return null;

      const indent = line.match(/^[\t ]*/)[0].replace(/\t/g, ' '.repeat(INDENT_SIZE));
      const depth = Math.min(Math.floor(indent.length / INDENT_SIZE), MAX_DEPTH);

      return {
        depth,
        isBullet: BULLET_PATTERN.test(text),
        text: text.replace(BULLET_PATTERN, ''),
      };
    })
    .filter(Boolean);
}

// 평평한 줄 목록을 '항목 + 하위 항목'으로 묶는다. 첫 줄이 하위 단계여도 최상위로 올린다.
function groupByDepth(lines) {
  return lines.reduce((groups, line) => {
    if (line.depth === 0 || groups.length === 0) {
      groups.push({ text: line.text, children: [] });
    } else {
      groups[groups.length - 1].children.push(line.text);
    }

    return groups;
  }, []);
}

// 본문 한 줄이 '[사진 1]' 이면 그 자리에 첫 번째 이미지가 들어간다 (PM: 본문 중간에 사진, 2026-09-21)
const IMAGE_TOKEN = /^\[\s*사진\s*(\d+)\s*\]$/;

// 본문에 나온 [사진 N] 번호들
export function referencedImageIndexes(content = '') {
  return String(content)
    .split('\n')
    .map((line) => IMAGE_TOKEN.exec(line.trim())?.[1])
    .filter(Boolean)
    .map((n) => Number(n) - 1);
}

function InlineImage({ image }) {
  if (!image) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={apiUrl(image.url)}
      alt={image.fileName ?? '일정 이미지'}
      loading="lazy"
      className="my-3 h-auto w-full max-w-[640px] rounded-[6px] border border-[#EDEDED]"
    />
  );
}

// 일정 상세 - 세부 내용. images 를 주면 본문의 [사진 N] 줄에 그 이미지를 끼운다
export default function ScheduleDetailContent({ content = '', images = [] }) {
  if (!content) return null;

  const textClass =
    'break-words text-[14px] leading-[1.6] tracking-[-0.32px] text-[#212121] md:text-[16px]';

  // [사진 N] 줄을 경계로 본문을 토막 내고, 토막마다 원래 규칙(목록/줄바꿈)으로 그린다
  const rawLines = String(content).split('\n');
  const hasImageToken = images.length > 0 && rawLines.some((line) => IMAGE_TOKEN.test(line.trim()));
  if (hasImageToken) {
    const chunks = [];
    let buffer = [];
    rawLines.forEach((line) => {
      const match = IMAGE_TOKEN.exec(line.trim());
      if (match) {
        if (buffer.length) chunks.push({ type: 'text', text: buffer.join('\n') });
        buffer = [];
        chunks.push({ type: 'image', image: images[Number(match[1]) - 1] });
      } else {
        buffer.push(line);
      }
    });
    if (buffer.length) chunks.push({ type: 'text', text: buffer.join('\n') });

    return (
      <div className="flex flex-col">
        {chunks.map((chunk, index) =>
          chunk.type === 'image' ? (
            <InlineImage key={`img-${index}`} image={chunk.image} />
          ) : (
            <ScheduleDetailContent key={`text-${index}`} content={chunk.text} />
          )
        )}
      </div>
    );
  }

  const lines = parseLines(content);
  if (!lines.length) return null;

  // 목록 표기가 하나도 없으면 줄바꿈만 살려 그대로 보여준다. (공지 본문과 같은 방식)
  if (!lines.some((line) => line.isBullet)) {
    return <p className={`${textClass} select-text whitespace-pre-line`}>{content}</p>;
  }

  const items = groupByDepth(lines);

  return (
    <ul className={`${textClass} list-disc ps-[24px]`}>
      {items.map((item, index) => (
        <li key={`${item.text}-${index}`}>
          {item.text}

          {item.children.length > 0 && (
            <ul className="list-disc ps-[24px]">
              {item.children.map((child, childIndex) => (
                <li key={`${child}-${childIndex}`}>{child}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
