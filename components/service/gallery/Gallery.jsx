'use client';

import { useState } from 'react';
import { GALLERY_PHOTOS } from '@/constants/gallery';
import GalleryTile from './GalleryTile';

// 사진 방향에 따라 격자에서 차지하는 칸. 폰은 2열, PC 는 4열이고 세로 한 칸 높이는 고정이다.
//  - wide(파노라마)   : 가로 2칸
//  - landscape(가로)  : 가로 2칸 · 세로 1칸. 여섯 장에 한 장은 2×2 로 키워 리듬을 만든다
//  - portrait(세로)   : 세로 2칸
//  - square           : 1칸
// grid-flow-dense 가 빈 칸을 뒤 사진으로 메워 줄 끝이 들쭉날쭉해지지 않는다.
function spanClass(shape, index) {
  if (shape === 'portrait') return 'row-span-2';
  if (shape === 'wide') return 'col-span-2';
  if (shape === 'landscape') return index % 6 === 0 ? 'col-span-2 row-span-2' : 'col-span-2';
  return '';
}

const Gallery = () => {
  // 모바일 탭 캡션: 한 번에 한 타일만 활성 (새 이미지 탭 시 이전 것 풀림)
  const [activeSrc, setActiveSrc] = useState(null);

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-[51px] bg-white p-8">
      <header className="pb-[40px] border-b-[1.5px]">
        <h2 className="font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">
          활동 사진
        </h2>
      </header>

      <div className="grid w-full grid-flow-dense grid-cols-2 auto-rows-[150px] gap-2 md:grid-cols-4 md:auto-rows-[190px]">
        {GALLERY_PHOTOS.map((photo, index) => (
          <div key={photo.imageSrc} className={`relative min-w-0 ${spanClass(photo.shape, index)}`}>
            <GalleryTile photo={photo} activeSrc={activeSrc} onActivate={setActiveSrc} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
