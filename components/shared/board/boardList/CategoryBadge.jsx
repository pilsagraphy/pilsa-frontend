import { cn } from '@/lib/utils';

// 제목 옆 배지 — 목록(PC·모바일)·상세·이전다음이 모두 이걸 쓴다. 규칙을 한 곳에만 둔다.
//
// 색은 '중요'와 '공지'에만 준다. 그 둘은 운영진이 올린 것이라 눈에 띄어야 하지만,
// 일상·질문 같은 일반 카테고리까지 칠하면 목록이 검은 알약으로 가득 차 제목이 안 읽힌다.
// 일반 카테고리는 바탕도 테두리도 없이 회색 글자만 둔다.
const EMPHASIZED = ['중요', '공지'];

export const isEmphasizedCategory = (label) => EMPHASIZED.includes(String(label ?? '').trim());

export default function CategoryBadge({ children, variant = 'default' }) {
  const emphasized = isEmphasizedCategory(children);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center tracking-[-0.02em]',
        emphasized
          ? 'rounded-full bg-[#212121] text-white'
          : // 색 없는 쪽은 좌우 여백도 빼서 제목과의 간격이 두 배로 벌어지지 않게 한다
            'text-[#919191]',
        variant === 'default' &&
          cn('text-[12px] leading-[1.4]', emphasized ? 'px-2 py-0.5' : 'py-0.5'),
        variant === 'pinned' &&
          cn(
            'text-[11px] leading-[1.35] md:text-[12px] md:leading-[1.4]',
            emphasized ? 'rounded-md px-1.5 py-0.5 md:rounded-full md:px-2' : 'py-0.5'
          ),
        variant === 'mobile' &&
          cn('text-[14px] leading-none', emphasized ? 'h-[27px] px-3' : 'h-[27px]')
      )}
    >
      {children}
    </span>
  );
}
