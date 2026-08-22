'use client';

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

// 일정 상세 - 세부 내용
export default function ScheduleDetailContent({ content = '' }) {
  if (!content) return null;

  const lines = parseLines(content);
  if (!lines.length) return null;

  const textClass =
    'break-words text-[14px] leading-[1.6] tracking-[-0.32px] text-[#212121] md:text-[16px]';

  // 목록 표기가 하나도 없으면 줄바꿈만 살려 그대로 보여준다. (공지 본문과 같은 방식)
  if (!lines.some((line) => line.isBullet)) {
    return <p className={`${textClass} whitespace-pre-line`}>{content}</p>;
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
