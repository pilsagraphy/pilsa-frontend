// activity: 문자열, 또는 { text, video } — video 가 있으면 글 아래에 소리 없이 계속 도는 영상을 붙인다
const ActivityItem = ({ activity }) => {
  const text = typeof activity === 'string' ? activity : activity?.text;
  const video = typeof activity === 'string' ? null : activity?.video;

  return (
    <div className="flex items-start gap-5">
      {/* 회색 점: div로 간단히 처리 */}
      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#DEDEDE]" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="whitespace-pre-wrap text-[16px] leading-[1.6] tracking-tight text-[#212121]">
          {text}
        </p>
        {video && (
          // muted 여야 브라우저가 자동 재생을 허락한다. loop 로 영원히 돈다. playsInline 은 아이폰에서 전체화면으로 튀지 않게
          <video
            src={video}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            className="w-full max-w-[640px] rounded-[8px] bg-black"
          />
        )}
      </div>
    </div>
  );
};

export default ActivityItem;
