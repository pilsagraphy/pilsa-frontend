'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const GalleryTile = ({ photo }) => {
  // 마우스가 있는 기기(웹)인지 여부. SSR/초기값은 데스크톱으로 가정.
  const [canHover, setCanHover] = useState(true);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => {
      setCanHover(mq.matches);
      // 웹으로 전환되면 탭으로 켜둔 캡션은 닫아준다.
      if (mq.matches) setIsActive(false);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  if (!photo) return null;

  const hasCaption = Boolean(photo.title || photo.hashtags?.length);

  // 웹(마우스)에서는 클릭을 무시하고 hover만 사용, 터치 기기에서만 탭 토글.
  const handleClick = () => {
    if (!hasCaption || canHover) return;
    setIsActive((prev) => !prev);
  };

  return (
    <div
      className="group relative size-full overflow-hidden bg-[#D9D9D9]"
      onClick={handleClick}
    >
      <Image
        src={photo.imageSrc}
        alt={photo.title || '활동 사진'}
        fill
        className="object-cover"
        style={{ objectPosition: photo.objectPosition || 'center' }}
        sizes="(max-width: 768px) 33vw, 20vw"
      />
      {hasCaption && (
        <div
          className={`absolute inset-0 flex flex-col justify-center gap-[18px] bg-black/50 px-[29px] transition-opacity duration-300 ${
            canHover
              ? 'opacity-0 group-hover:opacity-100'
              : isActive
                ? 'opacity-100'
                : 'opacity-0'
          }`}
        >
          {photo.title && (
            <p className="font-['Pretendard:SemiBold',sans-serif] text-[16px] text-white leading-[1.5] tracking-[-0.32px] not-italic">
              {photo.title}
            </p>
          )}
          {photo.hashtags?.length > 0 && (
            <p className="font-['Pretendard:Regular',sans-serif] text-[12px] text-white leading-[1.5] tracking-[-0.24px] not-italic">
              {photo.hashtags.join(' ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GalleryTile;
