'use client';

import { openLightbox } from '@/stores/useLightboxStore';

// activity: 문자열, 또는 { text, video } / { text, youtube } — 영상이 있으면 글 아래에 소리 없이 계속 도는 영상을 붙인다.
//   video   서버 public/videos 의 mp4 경로
//   youtube 유튜브 영상 ID. 유튜브는 loop 만으로는 안 돌고 playlist 에 자기 ID 를 넣어야 무한 반복된다. mute 여야 자동 재생이 허락된다
//   images  [{ src, alt }] — 영상과 같은 폭(640px) 안에 가로로 나란히. 서버 public/history 의 파일 (레포에는 넣지 않는다)
const ActivityItem = ({ activity }) => {
  const text = typeof activity === 'string' ? activity : activity?.text;
  const video = typeof activity === 'string' ? null : activity?.video;
  const youtube = typeof activity === 'string' ? null : activity?.youtube;
  const images = typeof activity === 'string' ? null : activity?.images;

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
        {images?.length > 0 && (
          // 폰에서도 가로 배치 유지 — 세로로 긴 포스터라 둘을 나란히 두는 편이 낫다.
          // 칸은 포스터 비율(745:1059)로 고정하고 안을 채운다(object-cover). 클릭하면 사이트 공용 라이트박스에서 좌우로 넘겨 본다.
          // zoom: 여백이 많은 그림(잉크 포스터 — 흰 바탕에 위아래 회색 선)을 조금 키워 옆의 꽉 찬 포스터와 크기가 맞아 보이게 (PM, 2026-09-24)
          <div className="flex w-full max-w-[640px] gap-3">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => openLightbox(images.map((item) => ({ src: item.src, alt: item.alt ?? text })), index)}
                aria-label={`${image.alt ?? text} 크게 보기`}
                className="relative min-w-0 flex-1 cursor-zoom-in overflow-hidden rounded-[8px] bg-[#f5f5f5] pt-[142%]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- 서버에만 있는 파일이라 next/image 최적화 대상이 아니다 */}
                <img
                  src={image.src}
                  alt={image.alt ?? text}
                  loading="lazy"
                  style={image.zoom ? { transform: `scale(${image.zoom})` } : undefined}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityItem;
