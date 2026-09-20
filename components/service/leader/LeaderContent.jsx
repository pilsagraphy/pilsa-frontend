import Image from 'next/image';
import Link from 'next/link';

import { ROUTES } from '@/constants/routes';

// '(2021~2022)' → 2021. 재임 시작 연도의 연혁으로 보낸다
const startYearOf = (period) => /(\d{4})/.exec(String(period ?? ''))?.[1] ?? null;

const LeaderContent = ({ order, name, period, imageSrc, officers = [] }) => {
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
      <span className="whitespace-nowrap text-center font-['Pretendard',sans-serif] text-[17px] font-bold leading-normal tracking-[-0.4px] text-black md:text-[22px]">
        {order}
      </span>
      {/* 사진 영역: Next.js Image 최적화 적용 */}
      {/* 사진은 카드 폭보다 한 단계 작게 — 아래 임원진 글이 들어오면서 카드가 길어져 사진을 줄였다 (PM, 2026-09-21) */}
      <div className="relative aspect-[227/280] w-[78%] shrink-0 overflow-hidden bg-[#D9D9D9]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${name} 회장`}
            fill // 부모 컨테이너를 꽉 채우도록
            className="object-cover transition-transform duration-300 hover:scale-105" // 살짝 확대 효과 서비스!
            sizes="(max-width: 768px) 40vw, 26vw"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[#919191] text-sm">
            No Image
          </div>
        )}
      </div>
      {/* 이름 & 재임기간 */}
      <div className="flex flex-col items-center font-['Pretendard',sans-serif] text-black">
        <span className="text-[16px] font-semibold leading-tight md:text-[22px]">{name}</span>
        <span className="mt-1 text-[12px] font-medium text-[#454545] md:text-[15px]">{period}</span>
      </div>

      {/* 재임 중 임원진 — 학기별로 한 묶음. 사진 카드 폭 안에 작은 글자로 */}
      {officers.length > 0 && (
        <div className="flex w-full flex-col gap-3 border-t border-[#DEDEDE] pt-3 font-['Pretendard',sans-serif]">
          {officers.map(({ term, groups }) => (
            <div key={term} className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold tracking-[-0.24px] text-[#212121] md:text-[14px]">{term}</span>
              {groups.map(({ label, names }) => (
                <p
                  key={label}
                  className="text-[12px] leading-[1.6] tracking-[-0.24px] text-[#454545] md:text-[13px]"
                >
                  <span className="text-[#919191]">{label}</span> {names.join(' · ')}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </Link>
  );
};

export default LeaderContent;
