export default function BrandCIText({ title, children }) {
  return (
    <div className="flex gap-[20px] flex-col w-[427px]">
      <h3 className="text-[18px] font-medium text-[#212121]">{title}</h3>
      <div className="flex gap-[16px] text-[16px] font-normal text-[#212121] leading-[1.6] flex-col whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}