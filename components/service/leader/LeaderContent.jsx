import Image from "next/image";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import OfficersDialog from "./OfficersDialog";

// '(2021~2022)' → 2021. 재임 시작 연도의 연혁으로 보낸다
const startYearOf = (period) =>
  /(\d{4})/.exec(String(period ?? ""))?.[1] ?? null;

const LeaderContent = ({ order, name, period, imageSrc, officers = [] }) => {
  const year = startYearOf(period);
  return (
    // 전체 너비를 부모 그리드에 맡기고, 내부 요소들만 중앙 정렬.
    // 연혁 링크는 사진에만 건다 — 카드 전체가 링크면 이름·기수를 눌러도 튀어 나갔다 (PM, 2026-09-21).
    // 연혁 페이지가 #year-XXXX 를 받아 그 회장의 재임 시작 연도 줄로 내려간다
    <div className="mx-auto flex w-full max-w-[227px] flex-col items-center gap-3 md:gap-[25px]">
      {/* 순서 레이블: 01, 02 처럼 보일 수 있게 스타일링 */}
      <span className="whitespace-nowrap text-center font-['Pretendard',sans-serif] text-[18px] font-bold leading-normal tracking-[-0.4px] text-black md:text-[26px]">
        {order}
      </span>

      {/* 사진 영역: Next.js Image 최적화 적용. 사진만 연혁으로 가는 링크 */}
      <Link
        href={year ? `${ROUTES.ABOUT_HISTORY}#year-${year}` : ROUTES.ABOUT_HISTORY}
        title={`${year ?? ''}년 연혁 보기`}
        aria-label={`${name} 회장 — ${year ?? ''}년 연혁 보기`}
        className="relative aspect-[227/280] w-full shrink-0 overflow-hidden bg-[#D9D9D9]"
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${name} 회장`}
            fill // 부모 컨테이너를 꽉 채우도록
            className="object-cover transition-transform duration-300 hover:scale-105" // 살짝 확대 효과 서비스!
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#919191]">No Image</div>
        )}
      </Link>

      {/* 이름 & 재임기간 */}
      <div className="flex flex-col items-center font-['Pretendard',sans-serif] text-black">
        <span className="text-[17px] font-semibold leading-tight md:text-[24px]">{name}</span>
        <span className="mt-1 text-[13px] font-medium text-[#454545] md:text-[16px]">{period}</span>
      </div>

      {/* 재임 중 임원진은 카드에 나열하지 않고 버튼 → 팝업 (임원이 많은 기수는 카드가 한없이 길어진다) */}
      {officers.length > 0 && (
        <OfficersDialog order={order} name={name} officers={officers} />
      )}
    </div>
  );
};

export default LeaderContent;
