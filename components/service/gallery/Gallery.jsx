'use client';

import { useState } from 'react';
import { GALLERY_PHOTOS } from '@/constants/gallery';
import GalleryTile from './GalleryTile';

// 사진이 격자에서 차지하는 칸. 폰은 3열(한 칸 110px), PC 는 6열(한 칸 200px).
//
// 이 갤러리는 대부분 가로 사진이라 방향만으로 나누면 전부 같은 크기가 되어 밋밋하다.
// 그래서 세로·정사각은 방향대로, 가로 사진은 다섯 장에 한 장을 크게(hero) 키워 리듬을 만든다.
//  - portrait  : PC 2×2 (340×408, 세로 사진 비율에 맞음) · 폰 1×2
//  - square    : 1×1
//  - wide      : 2×1 (파노라마)
//  - landscape : 2×1, 다섯 장에 한 장은 PC 4×2 · 폰 3×2 (hero)
// grid-flow-dense 가 빈 칸을 뒤 사진으로 메워 줄 끝이 들쭉날쭉해지지 않는다.
function spanClass(shape, landscapeIndex) {
  if (shape === 'portrait') return 'row-span-2 md:col-span-2';
  if (shape === 'square') return '';
  if (shape === 'wide') return 'col-span-2';
  // landscape
  return landscapeIndex % 5 === 0 ? 'col-span-3 row-span-2 md:col-span-4' : 'col-span-2';
}

const Gallery = () => {
  // 모바일 탭 캡션: 한 번에 한 타일만 활성 (새 이미지 탭 시 이전 것 풀림)
  const [activeSrc, setActiveSrc] = useState(null);

  // 가로 사진끼리의 순번 — hero 를 '다섯 장에 한 장' 으로 세려면 세로·정사각을 건너뛰고 세어야 한다
  const landscapeOrdinal = [];
  let n = 0;
  for (const photo of GALLERY_PHOTOS) {
    landscapeOrdinal.push(photo.shape === 'landscape' ? n++ : -1);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white p-4 md:gap-[51px] md:p-8">
      <header className="pb-[40px] border-b-[1.5px]">
        <h2 className="font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">
          활동 사진
        </h2>
      </header>

      <div className="grid w-full grid-flow-dense grid-cols-3 auto-rows-[110px] gap-1.5 md:grid-cols-6 md:auto-rows-[200px] md:gap-2">
        {GALLERY_PHOTOS.map((photo, index) => (
          <div key={photo.imageSrc} className={`relative min-w-0 ${spanClass(photo.shape, landscapeOrdinal[index])}`}>
            <GalleryTile photo={photo} activeSrc={activeSrc} onActivate={setActiveSrc} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
