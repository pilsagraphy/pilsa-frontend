'use client';

import { useState } from 'react';
import { GALLERY_PHOTOS } from '@/constants/gallery';
import GalleryTile from './GalleryTile';

// 사진을 줄로 묶어, 각 줄이 화면 폭을 정확히 채우게 한다 (정렬 격자 / justified rows).
//
// 칸 수를 고정한 격자는 사진마다 차지하는 칸이 달라 줄 끝에 빈 칸이 남는다 — 오른쪽 선이 들쭉날쭉해졌다.
// 여기서는 반대로 간다: 한 줄에 들어갈 사진을 비율의 합으로 정하고, 각 사진의 폭을 제 비율만큼 나눠 갖게 한다.
// flex-grow 가 남는 폭을 비율대로 배분하므로 **줄은 언제나 좌우 끝까지 꽉 찬다.**
// 줄 높이는 그 줄 사진들의 비율 합으로 정해져(aspect-ratio), 줄마다 높이가 달라지며 리듬이 생긴다.
//
// TARGET 은 '한 줄의 비율 합' 목표다. 크면 한 줄에 더 많이·작게 들어간다.
// 폰은 2장 안팎, PC 는 3~4장이 되도록 잡았다.
const TARGET_MOBILE = 2.5;
const TARGET_DESKTOP = 4.6;

// 사진을 줄로 나눈다. 줄 수를 먼저 정하고 그 수에 맞춰 고르게 나눠, 마지막 줄만 혼자 커지는 일을 막는다.
function buildRows(photos, target) {
  const total = photos.reduce((sum, photo) => sum + photo.ratio, 0);
  const rowCount = Math.max(1, Math.round(total / target));
  const per = total / rowCount;

  const rows = [];
  let current = [];
  let sum = 0;

  photos.forEach((photo, index) => {
    current.push(photo);
    sum += photo.ratio;

    const rowsLeft = rowCount - rows.length - 1; // 이 줄을 닫고 나면 남는 줄 수
    const photosLeft = photos.length - index - 1;
    // 남은 사진이 남은 줄 수와 같아지면 무조건 닫는다 — 안 그러면 빈 줄이 생긴다
    const mustClose = photosLeft === rowsLeft;
    const canClose = rowsLeft > 0 && photosLeft > rowsLeft;

    if (mustClose || (sum >= per && canClose)) {
      rows.push(current);
      current = [];
      sum = 0;
    }
  });

  if (current.length) rows.push(current);
  return rows;
}

function GalleryRows({ rows, activeSrc, onActivate }) {
  return rows.map((row, rowIndex) => (
    <div
      key={rowIndex}
      className="flex w-full gap-1.5 md:gap-2"
      // 줄 전체의 가로:세로. 폭은 100% 이므로 높이가 여기서 정해진다
      style={{ aspectRatio: String(row.reduce((sum, photo) => sum + photo.ratio, 0)) }}
    >
      {row.map((photo) => (
        <div
          key={photo.imageSrc}
          className="relative min-w-0"
          // 제 비율만큼 폭을 나눠 갖는다 (basis 0 이라 폭은 전적으로 비율이 정한다)
          style={{ flex: `${photo.ratio} 1 0%` }}
        >
          <GalleryTile photo={photo} activeSrc={activeSrc} onActivate={onActivate} />
        </div>
      ))}
    </div>
  ));
}

const Gallery = () => {
  // 모바일 탭 캡션: 한 번에 한 타일만 활성 (새 이미지 탭 시 이전 것 풀림)
  const [activeSrc, setActiveSrc] = useState(null);

  // 줄 묶음은 화면 폭에 따라 달라야 한다(폰에서 4장이 한 줄에 들어가면 손톱만 해진다).
  // 두 벌을 미리 만들어 두고 CSS 로 하나만 보여 준다 — 화면 폭을 JS 로 재면 첫 그림이 한 번 튄다.
  // 숨은 쪽 사진은 화면에 없으므로 브라우저가 내려받지 않는다(lazy).
  const mobileRows = buildRows(GALLERY_PHOTOS, TARGET_MOBILE);
  const desktopRows = buildRows(GALLERY_PHOTOS, TARGET_DESKTOP);

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white p-4 md:gap-[51px] md:p-8">
      <header className="pb-[40px] border-b-[1.5px]">
        <h2 className="font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">
          활동 사진
        </h2>
      </header>

      <div className="flex w-full flex-col gap-1.5 md:hidden">
        <GalleryRows rows={mobileRows} activeSrc={activeSrc} onActivate={setActiveSrc} />
      </div>
      <div className="hidden w-full flex-col gap-2 md:flex">
        <GalleryRows rows={desktopRows} activeSrc={activeSrc} onActivate={setActiveSrc} />
      </div>
    </div>
  );
};

export default Gallery;
