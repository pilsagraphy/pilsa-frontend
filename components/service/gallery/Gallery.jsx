import { GALLERY_PHOTOS } from '@/constants/gallery';
import GalleryTile from './GalleryTile';
import GalleryMobile from './GalleryMobile';

const Gallery = () => {
  const [
    photo1,
    photo2,
    photo3,
    photo4,
    photo5,
    photo6,
    photo7,
    photo8,
    photo9,
    photo10,
    photo11,
  ] = GALLERY_PHOTOS;

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-[34px] bg-white p-5 md:gap-[51px] md:p-8">
      <header className="border-b-[1.5px] pb-[16px] md:pb-[40px]">
        <h2 className="font-['Pretendard',sans-serif] text-[18px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121] md:text-[24px]">
          활동 사진
        </h2>
      </header>

      {/* 모바일: 피그마 전용 레이아웃 (768px 미만에서만 노출) */}
      <div className="md:hidden">
        <GalleryMobile />
      </div>

      {/* 데스크톱: 전체 하나의 큰 직사각형(2:1) 안을 여백 없이 채우는 구조 */}
      <div className="hidden w-full aspect-[2/1] flex-col overflow-hidden md:flex">
        {/* 1, 2, 3번: 가로 3장, 여백 없이 붙여서 */}
        <div className="flex flex-1">
          <div className="relative flex-1">
            <GalleryTile photo={photo1} />
          </div>
          <div className="relative flex-1">
            <GalleryTile photo={photo2} />
          </div>
          <div className="relative flex-1">
            <GalleryTile photo={photo3} />
          </div>
        </div>

        {/* 4, 5, 6번: 가로 3장, 여백 없이 붙여서 */}
        <div className="flex flex-1">
          <div className="relative flex-1">
            <GalleryTile photo={photo4} />
          </div>
          <div className="relative flex-1">
            <GalleryTile photo={photo5} />
          </div>
          <div className="relative flex-1">
            <GalleryTile photo={photo6} />
          </div>
        </div>

        {/* 7, 8, 9, 10, 11번: 가로 5장, 여백 없이 붙여서 */}
        <div className="flex flex-1">
          <div className="relative flex-1">
            <GalleryTile photo={photo7} />
          </div>
          <div className="relative flex-1">
            <GalleryTile photo={photo8} />
          </div>
          <div className="relative flex-1">
            <GalleryTile photo={photo9} />
          </div>
          <div className="relative flex-1">
            <GalleryTile photo={photo10} />
          </div>
          <div className="relative flex-1">
            <GalleryTile photo={photo11} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
