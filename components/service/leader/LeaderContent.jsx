import Image from 'next/image';

const LeaderContent = ({ order, name, period, imageSrc }) => {
  return (
    // 전체 너비를 부모 그리드에 맡기고, 내부 요소들만 중앙 정렬
    <div className="flex flex-col items-center gap-[25px] w-full max-w-[227px] mx-auto">
      {/* 순서 레이블: 01, 02 처럼 보일 수 있게 스타일링 */}
      <span className="font-['Pretendard',sans-serif] font-bold text-[32px] leading-normal tracking-[-0.64px] text-black text-center whitespace-nowrap">
        {order}
      </span>
      {/* 사진 영역: Next.js Image 최적화 적용 */}
      <div className="relative w-full aspect-[227/280] shrink-0 overflow-hidden bg-[#D9D9D9]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${name} 회장`}
            fill // 부모 컨테이너를 꽉 채우도록
            className="object-cover transition-transform duration-300 hover:scale-105" // 살짝 확대 효과 서비스!
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[#919191] text-sm">
            No Image
          </div>
        )}
      </div>
      {/* 이름 & 재임기간 */}
      <div className="flex flex-col items-center font-['Pretendard',sans-serif] text-black">
        <span className="text-[30px] font-semibold leading-tight">{name}</span>
        <span className="text-[20px] font-medium text-[#454545] mt-1">{period}</span>
      </div>
    </div>
  );
};

export default LeaderContent;
