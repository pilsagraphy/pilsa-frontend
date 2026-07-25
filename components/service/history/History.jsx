import HistoryRow from './HistoryRow';
import { DUMMY_HISTORY } from '@/constants/history';

export default function History() {
  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-[40px] bg-white p-8">
      {/* 타이틀 및 서브타이틀 영역 */}
      <div className="flex w-full flex-col gap-[12px]">
        <h2 className="font-['Pretendard'] text-[24px] font-semibold leading-[1.5] tracking-[-0.48px] text-[#212121]">
          연혁
        </h2>
        <p className="font-['Pretendard'] text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#919191]">
          필사그래피 연도별 주요 활동
        </p>
      </div>

      {/* 리스트 렌더링 영역 */}
      <div className="flex w-full flex-col">
        {DUMMY_HISTORY.map((data, index) => (
          <HistoryRow
            key={data.year}
            year={data.year}
            activities={data.activities}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
