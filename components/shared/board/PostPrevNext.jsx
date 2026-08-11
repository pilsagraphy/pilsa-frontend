'use client';

import Link from 'next/link';

import CategoryBadge from './CategoryBadge';
import { cn } from '@/lib/utils';

/**
 * 게시판 상세 하단 "이전 글 / 현재 글 / 다음 글" 네비게이션 (공용)
 *
 * 피그마 시안 기준:
 * - 맨 위 헤더 줄(게시판 이름 + 짧은 선) + 이전/현재/다음 3줄, 각 줄 56px
 * - 각 줄: 라벨 + 카테고리 칩 + 제목 + (오른쪽) 날짜
 * - 현재 글은 실제 값, 이전/다음 글은 데이터가 아직 없어 임시 값으로 표시
 * - prevHref / nextHref 가 있으면 그 줄을 클릭해 이동, 없으면 비활성
 *
 * @param {string} boardLabel  헤더에 표시할 게시판 이름 (예: '자유게시판의 글')
 * @param {{ categoryName?: string|null, title?: string, date?: string }} current  현재 글 정보
 * @param {string|null} prevHref  이전 글 이동 경로
 * @param {string|null} nextHref  다음 글 이동 경로
 */

// 날짜를 '2026.02.20' 형태로 통일한다. (ISO 문자열/이미 포맷된 문자열 모두 처리)
function formatDotDate(value) {
  if (!value) return '';
  // 이미 '2026. 02. 20.' / '2026.02.20' 형태면 공백·끝점만 정리한다.
  if (typeof value === 'string' && /^\d{4}\.\s?\d{1,2}\.\s?\d{1,2}/.test(value)) {
    return value.replace(/\s/g, '').replace(/\.$/, '');
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function Row({ label, categoryName, title, date, href, empty, borderClass }) {
  const inner = (
    <div className="flex h-[56px] items-center justify-between gap-3 px-[10px] md:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-[20px]">
        <span className="w-[52px] shrink-0 text-center text-[14px] tracking-[-0.02em] text-[#454545] md:w-[80px] md:text-[16px]">
          {label}
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-[10px]">
          {categoryName ? <CategoryBadge>{categoryName}</CategoryBadge> : null}
          <span
            className={cn(
              'min-w-0 truncate text-[14px] tracking-[-0.02em] md:text-[16px]',
              empty ? 'text-[#C4C4C4]' : 'text-[#454545]'
            )}
          >
            {title}
          </span>
        </div>
      </div>

      {date ? (
        <span className="shrink-0 text-[13px] tracking-[-0.02em] text-[#919191] md:text-[16px]">
          {date}
        </span>
      ) : null}
    </div>
  );

  // 이동 경로가 있으면 줄 전체를 클릭 가능한 링크로
  if (href) {
    return (
      <Link href={href} className={cn('block transition-colors hover:bg-[#F7F7F7]', borderClass)}>
        {inner}
      </Link>
    );
  }

  return <div className={borderClass}>{inner}</div>;
}

export default function PostPrevNext({ boardLabel, current, prevHref = null, nextHref = null }) {
  const currentCategory = current?.categoryName ?? null;
  const currentTitle = current?.title ?? '';
  const currentDate = formatDotDate(current?.date);

  return (
    <div className="mx-auto w-full max-w-[920px]">
      {/* 헤더: 게시판 이름 + 짧은 선 */}
      <div className="flex h-[56px] items-center justify-between border-t border-t-[#919191] px-[10px]">
        <span className="text-[14px] tracking-[-0.02em] text-[#919191] md:text-[16px]">
          {boardLabel}
        </span>
        <svg
          className="shrink-0"
          width="50"
          height="10"
          viewBox="0 0 50 10"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M0 5H49M44 1L49 5L44 9"
            stroke="#919191"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 이전 글 */}
      <Row
        label="이전 글"
        categoryName={prevHref ? '카테고리' : null}
        title={prevHref ? '제목입니다' : '이전 글이 없습니다'}
        date={prevHref ? '2026.00.00' : null}
        href={prevHref}
        empty={!prevHref}
        borderClass="border-t border-t-[#B9B9B9]"
      />

      {/* 현재 글 */}
      <Row
        label="현재 글"
        categoryName={currentCategory}
        title={currentTitle}
        date={currentDate}
        borderClass="border-t border-t-[#B9B9B9]"
      />

      {/* 다음 글 */}
      <Row
        label="다음 글"
        categoryName={nextHref ? '카테고리' : null}
        title={nextHref ? '제목입니다' : '다음 글이 없습니다'}
        date={nextHref ? '2026.00.00' : null}
        href={nextHref}
        empty={!nextHref}
        borderClass="border-y border-t-[#B9B9B9] border-b-[#919191]"
      />
    </div>
  );
}
