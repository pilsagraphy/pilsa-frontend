const LeaderContent = ({ order, name, period, imageSrc }) => {
  return (
    <div className="flex flex-col items-center gap-[25px] w-[227px]">
      {/* 순서 레이블 */}
      <span className="font-['Pretendard',sans-serif] font-bold text-[32px] leading-normal tracking-[-0.64px] text-black text-center whitespace-nowrap">
        {order}
      </span>

      {/* 사진 영역 */}
      <div className="w-[227px] h-[280px] shrink-0 overflow-hidden bg-[#D9D9D9]">
        {imageSrc ? (
          <img src={imageSrc} alt={`${name} 회장`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#D9D9D9]" />
        )}
      </div>

      {/* 이름 & 재임기간 */}
      <div className="flex flex-col items-center font-['Pretendard',sans-serif] font-medium leading-normal text-black w-full">
        <span className="text-[30px] text-center w-full">{name}</span>
        <span className="text-[20px] text-center w-full">{period}</span>
      </div>
    </div>
  );
};

export default LeaderContent;
