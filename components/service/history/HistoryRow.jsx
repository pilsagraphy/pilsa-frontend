import ActivityItem from './ActivityItem';

const HistoryRow = ({ year, activities, isFirst = false, focused = false }) => (
  <div
    id={`year-${year}`}
    // 역대 회장에서 링크로 오면 이 줄이 화면 가운데로 오고 연도가 진해진다
    className={`flex scroll-mt-[100px] gap-[70px] border-t py-10 transition-colors ${
      isFirst ? 'border-t-[1.5px] border-[#919191]' : 'border-[#DEDEDE]'
    } ${focused ? 'bg-[#FAFAFA]' : ''}`}
  >
    <span
      className={`w-20 text-[24px] font-semibold leading-none ${
        focused ? 'text-[#212121]' : 'text-[#b9b9b9]'
      }`}
    >
      {year}
    </span>
    <div className="flex flex-1 flex-col gap-1">
      {activities.map((activity, index) => (
        <ActivityItem key={`${year}-${index}`} text={activity} />
      ))}
    </div>
  </div>
);

export default HistoryRow;
