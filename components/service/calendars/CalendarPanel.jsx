'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';

export default function CalendarPanel({ selectedDate, onChangeDate, className = '' }) {
  const [internalDate, setInternalDate] = React.useState(new Date());
  const date = selectedDate ?? internalDate;

  const handleSelect = (next) => {
    if (!next) return;
    if (onChangeDate) onChangeDate(next);
    else setInternalDate(next);
  };

  return (
    <div className={`w-full rounded-[8px] border border-[#DEDEDE] bg-white p-[16px] ${className}`}>
      <Calendar mode="single" selected={date} onSelect={handleSelect} className="w-full" />
    </div>
  );
}
