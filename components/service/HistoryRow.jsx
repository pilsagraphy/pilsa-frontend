import React from 'react';
import ActivityItem from './ActivityItem';

const HistoryRow = ({ year, activities, isFirst = false }) => (
  <div className={`flex gap-[70px] py-10 border-t ${isFirst ? 'border-[#919191] border-t-[1.5px]' : 'border-[#DEDEDE]'}`}>
    <span className="text-[24px] font-semibold text-[#b9b9b9] leading-none w-20">
      {year}
    </span>
    <div className="flex flex-col gap-1 flex-1">
      {activities.map((activity, index) => (
        <ActivityItem key={index} text={activity} />
      ))}
    </div>
  </div>
);
export default HistoryRow;