// activity: 문자열, 또는 { text, video } / { text, youtube } — 영상이 있으면 글 아래에 소리 없이 계속 도는 영상을 붙인다.
//   video   서버 public/videos 의 mp4 경로
//   youtube 유튜브 영상 ID. 유튜브는 loop 만으로는 안 돌고 playlist 에 자기 ID 를 넣어야 무한 반복된다. mute 여야 자동 재생이 허락된다
const ActivityItem = ({ activity }) => {
  const text = typeof activity === 'string' ? activity : activity?.text;
  const video = typeof activity === 'string' ? null : activity?.video;
  const youtube = typeof activity === 'string' ? null : activity?.youtube;

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
        {youtube && (
          // 16:9 상자. nocookie 도메인은 재생 전까지 추적 쿠키를 심지 않는다. rel=0 은 끝나도 남의 영상을 안 보여준다
          <div className="relative w-full max-w-[640px] overflow-hidden rounded-[8px] bg-black pt-[56.25%]">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&mute=1&loop=1&playlist=${youtube}&playsinline=1&rel=0`}
              title={text}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityItem;
