import LeaderContent from './LeaderContent';
import { DUMMY_LEADER } from '@/constants/leader';

export default function Leader() {
  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[51px] md:p-10">
      {/* 타이틀 영역 */}
      <header className="flex flex-col gap-[12px] border-b-[1.5px] pb-6 md:pb-[40px]">
        <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.48px] text-[#212121]">
          역대 회장
        </h2>
        <p className="font-['Pretendard',sans-serif] font-normal text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]">
          2021~
        </p>
      </header>

      {/* 회장 카드 그리드 */}
      {/* 모바일도 2열 — 1열이면 카드 하나가 화면을 다 먹어 스크롤만 길어진다 */}
      <section className="grid grid-cols-2 justify-items-center gap-x-4 gap-y-10 sm:gap-x-10 sm:gap-y-20 md:grid-cols-3">
        {DUMMY_LEADER.map((leader, index) => (
          <LeaderContent
            key={index}
            {...leader} // 스프레드 연산자로 깔끔하게 전달
          />
        ))}
      </section>
    </div>
  );
}
