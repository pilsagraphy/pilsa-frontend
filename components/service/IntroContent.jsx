const IntroContent = ({ title, content }) => {
  const paragraphs = content.split(/\n\s*\n/);
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-[18px] font-medium leading-[1.6] tracking-[-0.02] text-[#919191]">
        {title}
      </div>
      <div className="text-[16px] leading-[1.6] tracking-[-0.02] text-[#212121] space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="indent-[1em]">
            {paragraph.trim()}
          </p>
        ))}
      </div>
    </div>
  );
};
export default IntroContent;
