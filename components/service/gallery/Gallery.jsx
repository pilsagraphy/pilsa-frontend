import { GALLERY_PHOTOS } from '@/constants/gallery';
import GalleryTile from './GalleryTile';

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
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-[51px] bg-white p-8">
      <header className="pb-[40px] border-b-[1.5px]">
        <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">
          활동 사진
        </h2>
      </header>

      {/* 전체 하나의 큰 직사각형(2:1) 안을 여백 없이 채우는 구조 */}
      <div className="flex flex-col w-full aspect-[2/1] overflow-hidden">
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
