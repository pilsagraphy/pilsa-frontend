import ActivityItem from './ActivityItem';

const HistoryRow = ({ year, activities, isFirst = false, focused = false }) => (
  <div
    id={`year-${year}`}
    // 역대 회장에서 링크로 오면 이 줄이 화면 가운데로 오고 연도가 진해진다
    // 첫 행은 윗줄을 긋지 않는다 — 제목 칸의 밑줄과 겹쳐 두 줄로 보였다
    className={`flex scroll-mt-[100px] gap-[70px] py-10 transition-colors ${
      isFirst ? '' : 'border-t border-[#DEDEDE]'
    } ${focused ? 'bg-[#FAFAFA]' : ''}`}
  >
    <span
      className={`w-20 text-[24px] font-bold leading-none ${
        focused ? 'text-[#212121]' : 'text-[#757575]'
      }`}
    >
      {year}
    </span>
    <div className="flex flex-1 flex-col gap-1">
      {activities.map((activity, index) => (
        <ActivityItem key={`${year}-${index}`} activity={activity} />
      ))}
    </div>
  </div>
);

export default HistoryRow;
