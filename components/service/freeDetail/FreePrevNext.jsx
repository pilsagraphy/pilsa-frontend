'use client';

import React from 'react';

import PostPrevNext from '@/components/shared/board/PostPrevNext';

function extractPostId(apiPath) {
  if (!apiPath) return null;
  const match = String(apiPath).match(/\/posts\/(\d+)/);
  return match ? match[1] : null;
}

export default function FreePrevNext({
  prevPostApi,
  nextPostApi,
  currentTitle,
  currentCategory,
  currentDate,
}) {
  const prevPostId = extractPostId(prevPostApi);
  const nextPostId = extractPostId(nextPostApi);

  const prevHref = prevPostId ? `/students/free/${prevPostId}` : null;
  const nextHref = nextPostId ? `/students/free/${nextPostId}` : null;

  return (
    <PostPrevNext
      boardLabel="자유게시판의 글"
      current={{ categoryName: currentCategory, title: currentTitle, date: currentDate }}
      prevHref={prevHref}
      nextHref={nextHref}
    />
  );
}
