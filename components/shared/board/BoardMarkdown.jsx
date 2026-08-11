'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

import { markdownSanitizeSchema } from '@/lib/markdown';
import AuthedImage from './AuthedImage';

// 게시글 본문(마크다운) 렌더러. 상세 화면과 글쓰기 미리보기가 함께 쓴다.
//
// - remarkGfm: 표·체크리스트·취소선·자동링크 등 GitHub 문법
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
      className="text-[#212121] underline underline-offset-2 hover:text-black"
      {...props}
    >
      {children}
    </a>
  ),

  h1: ({ node, ...props }) => (
    <h1 className="mt-6 mb-3 text-[22px] font-semibold text-[#212121] md:text-[24px]" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="mt-6 mb-3 text-[20px] font-semibold text-[#212121] md:text-[22px]" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="mt-5 mb-2 text-[18px] font-semibold text-[#212121] md:text-[20px]" {...props} />
  ),

  p: ({ node, ...props }) => <p className="my-3 break-words" {...props} />,

  ul: ({ node, ...props }) => <ul className="my-3 list-disc space-y-1 pl-6" {...props} />,
  ol: ({ node, ...props }) => <ol className="my-3 list-decimal space-y-1 pl-6" {...props} />,

  blockquote: ({ node, ...props }) => (
    <blockquote
      className="my-4 border-l-[3px] border-[#DEDEDE] pl-4 text-[#919191]"
      {...props}
    />
  ),

  hr: () => <hr className="my-6 border-t border-[#DEDEDE]" />,

  // 인라인 코드(`code`)는 컴포넌트로 구분하지 않는다 —
  // react-markdown v9 부터 code 에 inline prop 이 오지 않아, 아래 래퍼의 CSS 선택자로 처리한다.
  pre: ({ node, ...props }) => (
    <pre
      className="my-4 overflow-x-auto rounded-[4px] bg-[#f5f5f5] p-4 text-[14px] leading-[1.6] text-[#212121]"
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
      className="border border-[#DEDEDE] bg-[#f5f5f5] px-3 py-2 text-left font-semibold"
      {...props}
    />
  ),
  td: ({ node, ...props }) => <td className="border border-[#DEDEDE] px-3 py-2" {...props} />,
};

export default function BoardMarkdown({ content = '' }) {
  if (!content) return null;

  return (
    <div
      className="w-full break-words text-[15px] leading-[1.65] tracking-[-0.32px] text-[#212121] md:text-[16px] md:leading-[1.6]
        [&_:not(pre)>code]:rounded-[3px] [&_:not(pre)>code]:bg-[#f5f5f5]
        [&_:not(pre)>code]:px-[5px] [&_:not(pre)>code]:py-[2px] [&_:not(pre)>code]:text-[14px]"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
