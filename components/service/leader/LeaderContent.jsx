import Image from 'next/image';
import Link from 'next/link';

import { ROUTES } from '@/constants/routes';

// '(2021~2022)' → 2021. 재임 시작 연도의 연혁으로 보낸다
const startYearOf = (period) => /(\d{4})/.exec(String(period ?? ''))?.[1] ?? null;

const LeaderContent = ({ order, name, period, imageSrc }) => {
  const year = startYearOf(period);
  return (
    // 전체 너비를 부모 그리드에 맡기고, 내부 요소들만 중앙 정렬.
    // 카드를 누르면 그 회장의 재임 시작 연도 연혁으로 간다 (연혁 페이지가 #year-XXXX 를 받아 그 줄로 내려간다)
    <Link
      href={year ? `${ROUTES.ABOUT_HISTORY}#year-${year}` : ROUTES.ABOUT_HISTORY}
      title={`${year ?? ''}년 연혁 보기`}
      className="mx-auto flex w-full max-w-[227px] flex-col items-center gap-3 md:gap-[25px]"
    >
      {/* 순서 레이블: 01, 02 처럼 보일 수 있게 스타일링 */}
      <span className="whitespace-nowrap text-center font-['Pretendard',sans-serif] text-[20px] font-bold leading-normal tracking-[-0.64px] text-black md:text-[32px]">
        {order}
      </span>
      {/* 사진 영역: Next.js Image 최적화 적용 */}
      <div className="relative w-full aspect-[227/280] shrink-0 overflow-hidden bg-[#D9D9D9]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${name} 회장`}
            fill // 부모 컨테이너를 꽉 채우도록
            className="object-cover transition-transform duration-300 hover:scale-105" // 살짝 확대 효과 서비스!
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[#919191] text-sm">
            No Image
          </div>
        )}
      </div>
      {/* 이름 & 재임기간 */}
      <div className="flex flex-col items-center font-['Pretendard',sans-serif] text-black">
        <span className="text-[18px] font-semibold leading-tight md:text-[30px]">{name}</span>
        <span className="mt-1 text-[13px] font-medium text-[#454545] md:text-[20px]">{period}</span>
        <span className="mt-[6px] text-[12px] text-[#919191] underline underline-offset-2 md:text-[13px]">
          연혁 보기
        </span>
      </div>
    </Link>
  );
};

export default LeaderContent;
