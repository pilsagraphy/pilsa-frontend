'use client';
import React from 'react';
import StatCard from './StatCard';
import { STATS } from './AdminMocs';

// StatCard 목록을 회색 세로 바로 구분하여 나열


export default function StatsSection({ stats = STATS }) {
  return (
    <div className="flex w-full items-stretch justify-center py-[10px]">
      {stats.map((stat, index) => (
        <React.Fragment key={stat.label}>
          <div className="flex flex-1 justify-center">
            <StatCard value={stat.value} label={stat.label} />
          </div>
          {index < stats.length - 1 && (
            <div className="w-px flex-shrink-0 self-stretch bg-[#919191]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
