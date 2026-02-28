import BrandCIText from "./BrandCIText";
import BrandCILogo from "./BrandCILogo";
import DownloadButton from "./DownloadButton";
import BrandColor from "./BrandColor";

export default function BrandCIContent() {
  return (
    <div className="flex gap-[40px] flex-col w-full">
      {/* 구분선 */}
      <div className="w-full h-[1px] bg-[#919191]" />
      
      {/* 1. 상단 로고 섹션 */}
      <div className="flex gap-[90px] items-start">
        <BrandCIText title="로고">
          <p>해당 심볼은 문자를 그리는 행위가 아닌 쌓아가는 과정으로 해석한 시각 아이덴티티입니다.</p>
          <p>로고의 각 획은 하나의 완성된 선이 아니라, 점과 점이 반복적으로 연결되며 형성된 구조로 구성되어 있습니다. 이 형태는 과정 기반 제너러티브 그래픽를 활용해 제작되었으며, 동일한 규칙 아래에서 생성되지만 미세한 차이를 갖는 점들의 집합을 통해 필사라는 행위가 지닌 반복성, 집중, 그리고 시간의 축적을 시각적으로 표현합니다.</p>
          <p>유기적으로 이어지는 형태는 필사가 지닌 아날로그적 감각과 동아리가 추구하는 천천히 쓰고 생각하는 경험을 상징합니다.</p>
        </BrandCIText>
        
        <div className="flex gap-[12px] items-start">
          <BrandCILogo />
          <DownloadButton />
        </div>
      </div>

      {/* 2. 하단 컬러 섹션 */}
      <div className="flex gap-[138px] items-start">
        <BrandCIText title="브랜드 컬러">
          <p>#212121 흑연색</p>
          <p>완전한 블랙보다 부드럽고 안정감 있는 톤으로, 차분하고 정돈된 이미지를 전달합니다. 과도하게 강하지 않으면서도 선명한 대비를 만들어 가독성과 활용도가 높은 색상입니다.</p>
          <p>연필심의 흑연을 떠올리게 하는 이 컬러는 ‘쓰기’라는 행위의 본질에 가장 가까운 색으로, 필사그래피의 핵심 가치인 집중, 기록, 기본에 충실함을 시각적으로 표현합니다.</p>
        </BrandCIText>
        
        <BrandColor />
      </div>
    </div>
  );
}