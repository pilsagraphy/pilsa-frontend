import BrandCIText from "./BrandCIText";
import BrandCILogo from "./BrandCILogo";
import DownloadButton from "./DownloadButton";
import BrandColor from "./BrandColor";

import { BRAND_CI_TEXT } from "../../../constants/brandCI/BrandCIData";

export default function BrandCIContent() {
  return (
    <div className="flex flex-col gap-[80px] w-full"> 
      
      {/* 1. 로고 섹션 */}
      <section className="flex gap-[60px] items-start justify-between">
        <BrandCIText title="로고">
          {BRAND_CI_TEXT.logo.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </BrandCIText>
        
        <div className="flex gap-[12px] items-start">
          <BrandCILogo />
          <DownloadButton />
        </div>
      </section>

      {/* 2. 컬러 섹션 */}
      <section className="flex gap-[60px] items-start justify-between">
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