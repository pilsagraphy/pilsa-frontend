'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

import { highlightClass, markdownSanitizeSchema, pickColorStyle } from '@/lib/markdown';
import AuthedImage from './AuthedImage';

// 게시글 본문(마크다운) 렌더러. 상세 화면과 글쓰기 미리보기가 함께 쓴다.
//
// - remarkGfm: 표·체크리스트·취소선·자동링크 등 GitHub 문법
// - remarkBreaks: 엔터 한 번을 줄바꿈으로 — 마크다운 원칙(빈 줄이어야 문단)은 글 쓰는 회원에겐 낯설다 (PM, 2026-09-21)
// - rehypeRaw: 본문에 섞인 raw HTML(<img width=... />) 처리
// - rehypeSanitize: 그 raw HTML 로 스크립트가 들어오지 못하게 걸러낸다 (반드시 raw 다음에)
//
// 이 프로젝트에는 typography 플러그인이 없어 요소별 스타일을 직접 지정한다.
const components = {
  img: ({ node, ...props }) => <AuthedImage {...props} />,

  a: ({ node, href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // 본문에 붙여 넣은 긴 주소는 끊을 자리가 없어 break-all 로 (전역 keep-all 예외)
      // 글자색은 상속 — 형광펜(hl-light) 안의 링크가 다크모드에서 밝은 글자로 남아 안 보였다 (PM 10/11). 밑줄만 링크 표시
      className="break-all underline underline-offset-2 hover:opacity-80"
      {...props}
    >
      {children}
    </a>
  ),

  // 글자색·배경색 — 편집기가 넣은 style 중 색만 통과시킨다 (pickColorStyle)
  // 형광펜(배경색)만 있는 글자는 배경 밝기에 맞춰 hl-light/hl-dark 클래스를 붙인다 — 다크모드에서 연한 배경 위 글자가 검정이 되게 (globals.css)
  span: ({ node, style, ...props }) => <span style={pickColorStyle(style)} className={highlightClass(style)} {...props} />,

  h1: ({ node, ...props }) => (
    <h1 className="mt-6 mb-3 text-[22px] font-semibold text-ink lg:text-[24px]" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="mt-6 mb-3 text-[20px] font-semibold text-ink lg:text-[22px]" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="mt-5 mb-2 text-[18px] font-semibold text-ink lg:text-[20px]" {...props} />
  ),
  // H4~H6 — 편집기 제목 메뉴가 여섯 단계라 아래 세 단계도 본문보다 조금씩 크게 그린다
  h4: ({ node, ...props }) => (
    <h4 className="mt-4 mb-2 text-[17px] font-semibold text-ink lg:text-[18px]" {...props} />
  ),
  h5: ({ node, ...props }) => (
    <h5 className="mt-4 mb-2 text-[16px] font-semibold text-ink lg:text-[17px]" {...props} />
  ),
  h6: ({ node, ...props }) => (
    <h6 className="mt-4 mb-2 text-[15px] font-semibold text-ink lg:text-[16px]" {...props} />
  ),

  p: ({ node, ...props }) => <p className="my-3 break-words" {...props} />,

  ul: ({ node, ...props }) => <ul className="my-3 list-disc space-y-1 pl-6" {...props} />,
  ol: ({ node, ...props }) => <ol className="my-3 list-decimal space-y-1 pl-6" {...props} />,

  blockquote: ({ node, ...props }) => (
    <blockquote
      className="my-4 border-l-[3px] border-line pl-4 text-ink-3"
      {...props}
    />
  ),

  hr: () => <hr className="my-6 border-t border-line" />,

  // 인라인 코드(`code`)는 컴포넌트로 구분하지 않는다 —
  // react-markdown v9 부터 code 에 inline prop 이 오지 않아, 아래 래퍼의 CSS 선택자로 처리한다.
  pre: ({ node, ...props }) => (
    <pre
      className="my-4 overflow-x-auto rounded-[4px] bg-surface-2 p-4 text-[14px] leading-[1.6] text-ink [word-break:normal]"
      {...props}
    />
  ),

  // 표는 좁은 화면에서 본문을 밀어내지 않도록 자체 스크롤을 준다
  table: ({ node, ...props }) => (
    <div className="my-4 w-full overflow-x-auto">
      <table className="w-full border-collapse text-[15px]" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th
      className="border border-line bg-surface-2 px-3 py-2 text-left font-semibold"
      {...props}
    />
  ),
  td: ({ node, ...props }) => <td className="border border-line px-3 py-2" {...props} />,
};

export default function BoardMarkdown({ content = '' }) {
  if (!content) return null;

  return (
    <div
      className="w-full break-words text-[15px] leading-[1.65] tracking-[-0.32px] text-ink lg:text-[16px] lg:leading-[1.6]
        [&_:not(pre)>code]:rounded-[3px] [&_:not(pre)>code]:bg-surface-2
        [&_:not(pre)>code]:px-[5px] [&_:not(pre)>code]:py-[2px] [&_:not(pre)>code]:text-[14px]
        [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
