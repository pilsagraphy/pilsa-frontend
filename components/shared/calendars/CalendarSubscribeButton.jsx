'use client';

import { useState } from 'react';
import { CalendarPlus, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { getCalendarFeedUrl } from '@/constants/calendar';
import { isAndroid, isIOS } from '@/lib/platform';

// 일정 구독 버튼.
//
// 플랫폼마다 되는 경로가 달라서 한 버튼으로 세 갈래로 나눈다.
//  - iOS      : webcal:// → 네이티브 캘린더가 구독 다이얼로그를 띄운다. 진짜 구독(자동 갱신)이고 갱신 주기도 고를 수 있다.
//  - 데스크톱  : 구글 캘린더 "URL로 추가" 화면. 역시 진짜 구독.
//  - 안드로이드 : 원탭 경로가 없다. 구글 캘린더 앱에는 URL 구독 기능 자체가 없고(웹 전용),
//                webcal:// 을 받아주는 기본 앱도 없다. 그래서 주소 복사 + 안내로 보낸다.
export default function CalendarSubscribeButton() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubscribe = () => {
    const feed = getCalendarFeedUrl();

    if (isAndroid()) {
      setGuideOpen(true);
      return;
    }

    if (isIOS()) {
      // window.open 은 커스텀 스킴에서 팝업 차단에 걸린다. location.href 여야 한다.
      // http 로 붙어도 nginx 가 301 로 https 에 넘겨주므로 스킴만 갈아끼우면 된다.
      window.location.href = feed.replace(/^https?:/, 'webcal:');
      return;
    }

    window.open(
      `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feed)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCalendarFeedUrl());
      setCopied(true);
      toast.success('주소를 복사했어요');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했어요. 주소를 길게 눌러 직접 복사해주세요.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleSubscribe}
        className="inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-[8px] border border-[#E0E0E0] px-3 text-[13px] font-medium text-[#454545] transition hover:border-[#BDBDBD] hover:text-[#212121] sm:h-[40px] sm:px-4 sm:text-[14px]"
      >
        <CalendarPlus size={16} />내 캘린더에 구독
      </button>

      {guideOpen && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]"
            onClick={() => setGuideOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-[90] mx-auto max-w-[480px] rounded-t-[20px] bg-white px-6 pb-8 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#E0E0E0]" />

            <div className="flex flex-col items-center gap-3 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-[#F5F5F5]">
                <CalendarPlus size={28} className="text-[#212121]" />
              </span>
              <h3 className="text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-black">
                PC에서 한 번만 등록하면 됩니다
              </h3>
              <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#757575] [word-break:keep-all]">
                구글 캘린더 앱에는 주소로 구독하는 기능이 없어요. PC 브라우저에서{' '}
                <span className="text-[#454545]">calendar.google.com</span> → 다른 캘린더{' '}
                <span className="text-[#454545]">+</span> → <span className="text-[#454545]">URL로 추가</span>에 아래
                주소를 넣어주세요. 한 번 등록하면 휴대폰 앱에도 자동으로 나타납니다.
              </p>
            </div>

            <div className="mt-5 rounded-[8px] bg-[#F5F5F5] px-3 py-3">
              <p className="break-all text-[12px] leading-[1.5] text-[#454545]">{getCalendarFeedUrl()}</p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#212121] text-[16px] font-semibold text-white transition hover:bg-black"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? '복사됨' : '주소 복사'}
              </button>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="h-[44px] w-full rounded-[8px] text-[15px] font-medium text-[#919191] transition hover:text-[#454545]"
              >
                닫기
              </button>
            </div>

            <p className="mt-4 text-center text-[12px] leading-[1.6] text-[#BDBDBD] [word-break:keep-all]">
              모바일 크롬에서 ⋮ → 데스크톱 사이트를 켜면 휴대폰에서도 등록할 수 있어요.
            </p>
          </div>
        </>
      )}
    </>
  );
}
