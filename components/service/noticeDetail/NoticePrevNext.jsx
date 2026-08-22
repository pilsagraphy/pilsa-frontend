'use client';

import React from 'react';

import PostPrevNext from '@/components/shared/board/PostPrevNext';

export default function NoticePrevNext({ links, currentTitle, currentImportant, currentDate }) {
  if (!links) return null;

  const { prev, next } = links;

  const prevHref = prev?.href ?? null;
  const nextHref = next?.href ?? null;

  // 공지사항은 카테고리가 없다. '중요' 공지일 때만 뱃지를 표시한다.
  const currentCategory = currentImportant ? '중요' : null;

  return (
    <PostPrevNext
      boardLabel="공지사항의 글"
      current={{ categoryName: currentCategory, title: currentTitle, date: currentDate }}
      prevHref={prevHref}
      nextHref={nextHref}
    />
  );
}
