'use client';

import Image from 'next/image';

/**
 * 모바일 전용 활동사진 타일 (피그마 hover 시안 기준)
 * - 오버레이: #212121 60%, 위쪽 정렬(제목 위 / 해시태그 아래)
 * - 활성 여부(isActive)와 열고닫기(onToggle)는 부모(GalleryMobile)가 관리한다.
 *   → 한 번에 하나만 열리도록 부모에서 제어.
 * - 마우스 기기(canHover)면 호버로 표시하고 탭 토글은 무시한다.
 */
const GalleryMobileTile = ({ photo, isActive, canHover, onToggle }) => {
  if (!photo) return null;

  const hasCaption = Boolean(photo.title || photo.hashtags?.length);

  const handleClick = () => {
    if (!hasCaption || canHover) return;
    onToggle();
  };

  return (
    <div className="group relative size-full overflow-hidden bg-[#D9D9D9]" onClick={handleClick}>
      <Image
        src={photo.imageSrc}
        alt={photo.title || '활동 사진'}
        fill
        className="object-cover"
        style={{ objectPosition: photo.objectPosition || 'center' }}
        sizes="(max-width: 768px) 50vw, 20vw"
      />

      {hasCaption && (
        <div
          className={`absolute inset-0 flex flex-col gap-[8px] bg-[#212121]/60 px-[14px] pt-[17px] transition-opacity duration-300 ${
            canHover
              ? 'opacity-0 group-hover:opacity-100'
              : isActive
                ? 'opacity-100'
                : 'opacity-0'
          }`}
        >
          {photo.title && (
            <p className="text-[16px] font-semibold leading-[1.5] tracking-[-0.02em] text-white">
              {photo.title}
            </p>
          )}
          {photo.hashtags?.length > 0 && (
            <p className="text-[12px] font-normal leading-[1.5] tracking-[-0.02em] text-white">
              {photo.hashtags.join(' ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GalleryMobileTile;
