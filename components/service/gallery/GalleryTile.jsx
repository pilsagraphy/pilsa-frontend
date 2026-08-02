import Image from 'next/image';

const GalleryTile = ({ photo }) => {
  const hasCaption = Boolean(photo.title || photo.hashtags?.length);

  return (
    <div className="group relative size-full overflow-hidden bg-[#D9D9D9]">
      <Image
        src={photo.imageSrc}
        alt={photo.title || '활동 사진'}
        fill
        className="object-cover"
        style={{ objectPosition: photo.objectPosition || 'center' }}
        sizes="(max-width: 768px) 33vw, 20vw"
      />
      {hasCaption && (
        <div className="absolute inset-0 flex flex-col justify-center gap-[18px] bg-black/40 px-[29px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
