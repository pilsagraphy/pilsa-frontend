import { cn } from '@/lib/utils';

// 제목 옆 배지 — 목록(PC·모바일)·상세·이전다음이 모두 이걸 쓴다. 규칙을 한 곳에만 둔다.
//
// 모양(크기·여백·둥글기)은 어느 카테고리든 같고 색만 다르다.
// '중요'·'공지'는 운영진이 올린 것이라 눈에 띄어야 해서 검정으로 채운다.
// 일상·질문 같은 일반 카테고리는 채우지 않고 테두리만 — 다 칠하면 목록이 검은 알약으로 가득 차
// 제목이 안 읽히고, 테두리까지 없애면 배지인지 그냥 글자인지 구분이 안 된다.
const EMPHASIZED = ['중요', '공지'];

export const isEmphasizedCategory = (label) => EMPHASIZED.includes(String(label ?? '').trim());

// variant 는 놓이는 자리에 따른 크기만 정한다 (색은 라벨이 정한다)
const SHAPE = {
  default: 'rounded-full px-2 py-0.5 text-[12px] leading-[1.4]',
  pinned:
    'rounded-md px-1.5 py-0.5 text-[11px] leading-[1.35] xl:rounded-full xl:px-2 xl:text-[12px] xl:leading-[1.4]',
  mobile: 'h-[27px] rounded-full px-3 text-[14px] leading-none',
};

export default function CategoryBadge({ children, variant = 'default' }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center tracking-[-0.02em]',
        SHAPE[variant] ?? SHAPE.default,
        isEmphasizedCategory(children)
          ? 'bg-[#212121] text-white'
          : 'border border-[#919191] text-[#212121]'
      )}
    >
      {children}
    </span>
  );
}
