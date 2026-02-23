import LeaderContent from './LeaderContent';
import { DUMMY_LEADER } from '@/constants/leader';

export default function Leader() {
  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-[51px] bg-white p-8">
      {/* 타이틀 영역 */}
      <header className="flex flex-col gap-[12px] pb-[40px] border-b-[1.5px]">
        <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.48px] text-[#212121]">
          역대 회장
        </h2>
        <p className="font-['Pretendard',sans-serif] font-normal text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]">
          2021~
        </p>
      </header>

      {/* 회장 카드 그리드 */}
      <section className="grid grid-cols-3 gap-x-[140px] gap-y-[60px]">
        {DUMMY_LEADER.map((leader, index) => (
          <LeaderContent
            key={index}
            order={leader.order}
            name={leader.name}
            period={leader.period}
            imageSrc={leader.imageSrc}
          />
        ))}
      </section>
    </div>
  );
}
