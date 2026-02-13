import React from 'react';
const ActivityItem = ({ text }) => (
    <div className="flex gap-5 items-start">
        {/* 회색점:div로 간단하게 처리 */}
        <div className="mt-2.5 size-1.5 rounded-full bg-[#DEDEDE] shrink-0" />
        <p className="text-[16px] leading-[1.6] tracking-tight text-[#212121] whitespace-pre-wrap">
       
          {text}

        </p>
    </div>
);

export default ActivityItem;