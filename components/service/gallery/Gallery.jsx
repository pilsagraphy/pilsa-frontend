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
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[51px] md:p-10">
      <header className="border-b-[1.5px] pb-6 md:pb-[40px]">
        <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">
          활동 사진
        </h2>
      </header>

      {/* md 미만: 2열 정사각 타일. 아래 2:1 상자에 3·3·5장을 넣으면 폰에서 타일이 손톱만 해진다.
          장수가 홀수면 마지막 한 장은 두 칸을 차지해 빈 칸이 안 남는다. */}
      <div className="grid w-full grid-cols-2 gap-1 md:hidden">
        {GALLERY_PHOTOS.map((photo, index) => {
          const isLastOdd = index === GALLERY_PHOTOS.length - 1 && GALLERY_PHOTOS.length % 2 === 1;
          return (
            <div key={index} className={`relative ${isLastOdd ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}>
              <GalleryTile photo={photo} />
            </div>
          );
        })}
      </div>

      {/* md 이상: 전체 하나의 큰 직사각형(2:1) 안을 여백 없이 채우는 구조 */}
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
