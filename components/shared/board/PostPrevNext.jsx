'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import CategoryBadge from './boardList/CategoryBadge';
import { cn } from '@/lib/utils';
import { formatDotDate } from '@/lib/boardDetail';

/**
 * 게시판 상세 하단 "이전 글 / 현재 글 / 다음 글" 네비게이션 (공용)
 *
 * 피그마 시안 기준:
 * - 맨 위 헤더 줄(게시판 이름 + 목록으로 가는 화살표) + 이전/현재/다음 3줄, 각 줄 56px
 * - 각 줄: 라벨 + 카테고리 칩 + 제목 + (오른쪽) 날짜
 * - prevHref / nextHref 가 있으면 그 줄을 클릭해 이동, 없으면 '이전 글이 없습니다'로 비활성
 *
 * 이전/다음 글은 상세 응답의 prevPost / nextPost 를 그대로 쓴다.
 * (도입 당시에는 API 가 주지 않아 임시 값을 넣어 뒀지만 지금은 실제 데이터가 내려온다)
 *
 * @param {string} boardLabel  헤더에 표시할 문구 (예: '자유게시판의 글')
 * @param {string} listPath    헤더 화살표를 눌렀을 때 갈 목록 주소
 * @param {{ categoryName?: string|null, title?: string, date?: string }} current  현재 글
 * @param {{ categoryName?: string|null, title?: string, created?: string }|null} prev  이전 글
 * @param {{ categoryName?: string|null, title?: string, created?: string }|null} next  다음 글
 * @param {string|null} prevHref  이전 글 이동 경로
 * @param {string|null} nextHref  다음 글 이동 경로
 */

function Row({ label, categoryName, title, date, href, empty, borderClass }) {
  const inner = (
    <div className="flex h-[56px] items-center justify-between gap-3 px-[10px] md:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-[20px]">
        {/* whitespace-nowrap: '이전 글' 이 공백에서 두 줄로 쪼개지지 않게 한다 */}
        <span className="w-[52px] shrink-0 whitespace-nowrap text-center text-[14px] tracking-[-0.02em] text-[#454545] md:w-[80px] md:text-[16px]">
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

export default function PostPrevNext({
  boardLabel,
  listPath,
  current,
  prev = null,
  next = null,
  prevHref = null,
  nextHref = null,
}) {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-[920px]">
      {/* 헤더: 게시판 이름 + 목록으로 돌아가는 화살표 */}
      <div className="flex h-[56px] items-center justify-between border-t border-t-[#919191] px-[10px]">
        <span className="truncate text-[14px] tracking-[-0.02em] text-[#919191] md:text-[16px]">
          {boardLabel}
        </span>

        <button
          type="button"
          onClick={() => router.push(listPath)}
          aria-label="목록으로 이동"
          title="목록으로"
          className="shrink-0 text-[#919191] transition-colors hover:text-[#212121]"
        >
          <svg width="50" height="10" viewBox="0 0 50 10" fill="none" aria-hidden="true">
            <path
              d="M0 5H49M44 1L49 5L44 9"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* 이전 글 */}
      <Row
        label="이전 글"
        categoryName={prev?.categoryName}
        title={prev?.title ?? '이전 글이 없습니다'}
        date={prev ? formatDotDate(prev.created) : null}
        href={prevHref}
        empty={!prev}
        borderClass="border-t border-t-[#B9B9B9]"
      />

      {/* 현재 글 */}
      <Row
        label="현재 글"
        categoryName={current?.categoryName}
        title={current?.title ?? ''}
        date={formatDotDate(current?.date)}
        borderClass="border-t border-t-[#B9B9B9]"
      />

      {/* 다음 글 */}
      <Row
        label="다음 글"
        categoryName={next?.categoryName}
        title={next?.title ?? '다음 글이 없습니다'}
        date={next ? formatDotDate(next.created) : null}
        href={nextHref}
        empty={!next}
        borderClass="border-y border-t-[#B9B9B9] border-b-[#919191]"
      />
    </div>
  );
}
