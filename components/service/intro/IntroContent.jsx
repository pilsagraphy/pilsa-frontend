const IntroContent = ({ title, content }) => {
  const paragraphs = content.split(/\n\s*\n/);
  return (
    <div className="flex flex-col gap-5 w-full">
      <h3 className="text-[18px] font-semibold leading-[1.6] tracking-[-0.02em] text-[#212121]">
        {title}
      </h3>
      <div className="text-[16px] leading-[1.6] tracking-[-0.02em] text-[#454545] space-y-4">
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
