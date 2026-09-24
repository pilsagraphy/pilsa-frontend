'use client';

import { openLightbox } from '@/stores/useLightboxStore';

// activity: 문자열, 또는 { text, video?, link?, images? } — 영상이 있으면 글 아래에 소리 없이 계속 도는 영상을 붙인다.
//   video   서버 public/videos 의 mp4 경로. 유튜브 임베드는 로딩이 느려 원본 파일을 서버에서 직접 튼다 (PM, 2026-09-24)
//   link    { href, label } — 영상 아래 바로가기 한 줄 (유튜브 원본 등)
//   images  [{ src, alt, zoom?, wide? }] — 영상과 같은 상자(640px · 16:9) 안에 가로로 나란히. 서버 public/history 의 파일 (레포에는 넣지 않는다)
//           wide 는 16:9 한 장으로 상자를 꽉 채운다 (평화의 전당 사진)
const ActivityItem = ({ activity }) => {
  const text = typeof activity === 'string' ? activity : activity?.text;
  const video = typeof activity === 'string' ? null : activity?.video;
  const link = typeof activity === 'string' ? null : activity?.link;
  const images = typeof activity === 'string' ? null : activity?.images;
  const href = typeof activity === 'string' ? null : activity?.href;

  return (
    <div className="flex items-start gap-5">
      {/* 회색 점: div로 간단히 처리 */}
      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#DEDEDE]" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {href ? (
          // 글 자체가 바로가기인 항목 (예: 서포터즈 활동 인스타그램 릴스). 새 창
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit whitespace-pre-wrap text-[16px] leading-[1.6] tracking-tight text-[#212121] underline decoration-[#b9b9b9] underline-offset-4 transition-colors hover:decoration-[#212121]"
          >
            {text} ↗
          </a>
        ) : (
          <p className="whitespace-pre-wrap text-[16px] leading-[1.6] tracking-tight text-[#212121]">
            {text}
          </p>
        )}
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
        {link && (
          // 영상 아래 바로가기 한 줄 (예: 유튜브 원본). 새 창
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191] underline underline-offset-4 transition-colors hover:text-[#212121]"
          >
            {link.label} ↗
          </a>
        )}
        {images?.length > 0 && (
          // 폰에서도 가로 배치 유지 — 세로로 긴 포스터라 둘을 나란히 두는 편이 낫다.
          // 칸은 포스터 비율(745:1059)로 고정하고 안을 채운다(object-cover). 클릭하면 사이트 공용 라이트박스에서 좌우로 넘겨 본다.
          // zoom: 여백이 많은 그림(잉크 포스터 — 흰 바탕에 위아래 회색 선)을 조금 키워 옆의 꽉 찬 포스터와 크기가 맞아 보이게 (PM, 2026-09-24)
          // 줄 전체는 영상과 같은 상자(640px · 16:9)라 세로 길이가 영상과 같다. 포스터는 그 높이에 맞춰 자기 비율(745:1059)로 선다.
          // 높이는 aspect-ratio 로 잡는다 — padding-top 퍼센트는 부모 폭 기준이라 칸이 세로로 늘어나 이미지가 잘려 보였다 (2026-09-24 실수)
          <div className="flex aspect-video w-full max-w-[640px] justify-center gap-3">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => openLightbox(images.map((item) => ({ src: item.src, alt: item.alt ?? text })), index)}
                aria-label={`${image.alt ?? text} 크게 보기`}
                className={`relative h-full shrink-0 cursor-zoom-in overflow-hidden rounded-[8px] bg-[#f5f5f5] ${
                  image.wide ? 'w-full' : 'aspect-[745/1059]'
                }`}
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
