import ActivityItem from './ActivityItem';

const HistoryRow = ({ year, activities, isFirst = false }) => (
  <div
    className={`flex gap-[70px] border-t py-10 ${
      isFirst ? 'border-t-[1.5px] border-[#919191]' : 'border-[#DEDEDE]'
    }`}
  >
    <span className="w-20 text-[24px] font-semibold leading-none text-[#b9b9b9]">
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
