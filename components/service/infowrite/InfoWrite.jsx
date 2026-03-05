import React from 'react';
import InfoWriteForm from './InfoWriteForm';

export default function InfoWrite() {
  return (
    // [1순위] p, mx -> [3순위] relative, w, h, max-w 추가
    <div className="p-[40px] mx-auto relative w-full h-full max-w-[1000px]">
      <InfoWriteForm />
    </div>
  );
}
