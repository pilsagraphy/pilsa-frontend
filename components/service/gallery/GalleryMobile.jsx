'use client';

import { useState, useEffect } from 'react';

import { GALLERY_PHOTOS } from '@/constants/gallery';
import GalleryMobileTile from './GalleryMobileTile';

/**
 * 모바일 활동사진 레이아웃 (피그마 기준, 3열 그리드)
 * - 1행: 배너 (가로 전체, 3:1)
 * - 2~3행: 왼쪽 정사각 2칸 + 오른쪽 큰 사각(2×2)
 * - 4행: 정사각 3칸
 * - 탭하면 어두워지고 해시태그 표시. 한 번에 하나만 열리며,
 *   다른 칸을 탭하면 이전 칸은 닫히고 새 칸이 열린다.
 */
const GalleryMobile = () => {
  const [banner, a, big, b, c, d, e] = GALLERY_PHOTOS;

  const [activeIndex, setActiveIndex] = useState(null);
  // 터치 기기 우선(초기 false) → 마운트 후 실제 기기 종류로 보정
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => {
      setCanHover(mq.matches);
      if (mq.matches) setActiveIndex(null); // 웹으로 전환되면 탭으로 열어둔 캡션은 닫는다.
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // 같은 칸을 다시 탭하면 닫고, 다른 칸을 탭하면 그 칸만 열린다.
  const toggle = (index) => () =>
    setActiveIndex((prev) => (prev === index ? null : index));

  const layout = [
    { photo: banner, cls: 'col-span-3 col-start-1 row-start-1' },
    { photo: a, cls: 'col-start-1 row-start-2' },
    { photo: big, cls: 'col-span-2 row-span-2 col-start-2 row-start-2' },
    { photo: b, cls: 'col-start-1 row-start-3' },
    { photo: c, cls: 'col-start-1 row-start-4' },
    { photo: d, cls: 'col-start-2 row-start-4' },
    { photo: e, cls: 'col-start-3 row-start-4' },
  ];

  return (
    <div className="grid aspect-[3/4] w-full grid-cols-3 grid-rows-4 overflow-hidden">
      {layout.map(({ photo, cls }, index) => (
        <div key={index} className={`relative ${cls}`}>
          <GalleryMobileTile
            photo={photo}
            isActive={activeIndex === index}
            canHover={canHover}
            onToggle={toggle(index)}
          />
        </div>
      ))}
    </div>
  );
};

export default GalleryMobile;
