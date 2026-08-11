'use client';

import React from 'react';

import PostPrevNext from '@/components/shared/board/PostPrevNext';

function extractPostId(apiPath) {
  if (!apiPath) return null;
  const match = String(apiPath).match(/\/posts\/(\d+)/);
  return match?.[1] ?? null;
}

export default function InfoPrevNext({ links, currentTitle, currentCategory, currentDate }) {
  if (!links) return null;

  const { prevPostApi, nextPostApi } = links;

  const prevPostId = extractPostId(prevPostApi);
  const nextPostId = extractPostId(nextPostApi);

  const prevHref = prevPostId ? `/students/info/${prevPostId}` : null;
  const nextHref = nextPostId ? `/students/info/${nextPostId}` : null;

  return (
    <PostPrevNext
      boardLabel="정보게시판의 글"
      current={{ categoryName: currentCategory, title: currentTitle, date: currentDate }}
      prevHref={prevHref}
      nextHref={nextHref}
    />
  );
}
