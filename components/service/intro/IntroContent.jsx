const IntroContent = ({ title, content }) => {
  const paragraphs = content.split(/\n\s*\n/);
  return (
    <div className="flex flex-col gap-5 w-full">
      <h3 className="text-[18px] font-semibold leading-[1.6] tracking-[-0.02em] text-ink">
        {title}
      </h3>
      <div className="text-[16px] leading-[1.6] tracking-[-0.02em] text-ink-2 space-y-4">
        {paragraphs.map((paragraph, index) => (
          // 한 번의 줄바꿈도 그대로 보이게 (관리 화면에서 넣은 줄바꿈이 공백으로 뭉개지던 문제, 2026-10-11)
          <p key={index} className="indent-[1em] whitespace-pre-line">
            {paragraph.trim()}
          </p>
        ))}
      </div>
    </div>
  );
};
export default IntroContent;
