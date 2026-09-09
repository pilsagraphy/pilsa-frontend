import BrandCIText from './BrandCIText';
import BrandCILogo from './BrandCILogo';
import DownloadButton from './DownloadButton';
import BrandColor from './BrandColor';

import { BRAND_CI_TEXT } from '@/constants/brandCI';

export default function BrandCIContent() {
  // md 미만: 설명 → 이미지 순으로 세로 배치. 고정폭(427px·293px)을 나란히 두면 폰에서 글이 한 글자씩 세로로 늘어진다
  return (
    <div className="flex w-full flex-col gap-12 md:gap-[80px]">
      {/* 1. 로고 섹션 */}
      <section className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-[60px]">
        <BrandCIText title="로고">
          {BRAND_CI_TEXT.logo.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </BrandCIText>

        <div className="flex w-full items-start justify-center gap-[12px] md:w-auto md:justify-start">
          <BrandCILogo />
          <DownloadButton />
        </div>
      </section>

      {/* 2. 컬러 섹션 */}
      <section className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-[60px]">
        <BrandCIText title="브랜드 컬러">
          {BRAND_CI_TEXT.color.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </BrandCIText>

        <BrandColor />
      </section>
    </div>
  );
}
