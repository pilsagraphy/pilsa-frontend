'use client';

import { useState } from 'react';
import { GALLERY_PHOTOS } from '@/constants/gallery';
import GalleryTile from './GalleryTile';

// 각 줄에 들어갈 이미지 개수 (위 → 아래 순서).
// 이 숫자 배열만 바꾸면 줄 구성이 바뀐다. 합계는 GALLERY_PHOTOS 길이(현재 30)와 같아야 한다.
const ROW_SIZES = [2, 3, 3, 2, 3, 3, 4, 4, 3, 3];

// 사진 배열 → ROW_SIZES 개수대로 줄로 나눈다.
function buildRows(photos) {
  const rows = [];
  let i = 0;
  for (const size of ROW_SIZES) {
    rows.push(photos.slice(i, i + size));
    i += size;
  }
  // ROW_SIZES에 다 담기지 않은 사진이 남으면 마지막 줄에 붙인다 (안전장치).
  if (i < photos.length) rows.push(photos.slice(i));
  return rows;
}

const Gallery = () => {
  // 모바일 탭 캡션: 한 번에 한 타일만 활성 (새 이미지 탭 시 이전 것 풀림)
  const [activeSrc, setActiveSrc] = useState(null);

  const rows = buildRows(GALLERY_PHOTOS);

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-[51px] bg-white p-8">
      <header className="pb-[40px] border-b-[1.5px]">
        <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">
          활동 사진
        </h2>
      </header>

      {/* 줄들을 여백 없이 세로로 붙인다. 각 줄 높이는 가로폭÷6로 동일하게 유지된다
          (한 줄에 사진이 2개든 4개든 높이는 같고, 폭만 나눠 갖는다). */}
      <div className="flex w-full flex-col">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex w-full aspect-[6/1] overflow-hidden">
            {row.map((photo) => (
              <div key={photo.imageSrc} className="relative flex-1">
                <GalleryTile photo={photo} activeSrc={activeSrc} onActivate={setActiveSrc} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
