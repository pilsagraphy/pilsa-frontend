import svgPaths from "../../../constants/brandCI/BrandCIIcons"; 

export default function BrandCILogo() {
  return (
    <div className="flex gap-[5px] flex-col w-[293px]">
      <div className="w-[293px] h-[329px]">
        <svg className="w-full h-full" viewBox="0 0 293 329" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d={svgPaths.p24616600} fill="black" />
          <path d={svgPaths.p17c41080} fill="black" />
        </svg>
      </div>
      <p className="text-[12px] font-normal text-[#b9b9b9] leading-[1.4] whitespace-pre-wrap">
        *본 로고는 필사그래피의 로고이며 허가 없이 무단 복제, 배포, 전송 및 상업적 목적으로 사용하는 행위를 금지합니다. (필사그래피 회장 승인 이후 사용 가능합니다.)
      </p>
    </div>
  );
}