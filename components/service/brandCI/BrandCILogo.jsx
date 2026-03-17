import Image from 'next/image';

export default function BrandCILogo() {
  return (
    <div className="flex flex-col gap-[5px] w-[293px]">
      <div className="relative w-[293px] h-[329px]">
        <Image
          src="/images/brandCI/logo.png"
          alt="필사그래피 로고"
          fill
          className="object-contain"
          priority
        />
      </div>

      <p className="whitespace-pre-wrap text-[12px] font-normal leading-[1.4] text-[#b9b9b9]">
        *본 로고는 필사그래피의 로고이며 허가 없이 무단 복제, 배포, 전송 및 상업적 목적으로 사용하는
        행위를 금지합니다. (필사그래피 회장 승인 이후 사용 가능합니다.)
      </p>
    </div>
  );
}
