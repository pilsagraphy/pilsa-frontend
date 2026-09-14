'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { isIOS } from '@/lib/platform';
import { calendarFeedUrl, calendarWebcalUrl } from '@/lib/calendarFeed';

// 캘린더 구독(ICS) — 구글 캘린더 연동과 다른 길이다.
//
// 구글 연동은 서버가 각자 구글 캘린더에 일정을 직접 넣어 준다. 이쪽은 캘린더 앱이 주소를 주기적으로
// 읽어 가는 표준 구독이라 구글 계정이 없어도 되고, 구글 캘린더를 안 붙인 아이폰 기본 캘린더에서도 보인다.
//
// 구독을 푸는 것은 **우리가 할 수 없다.** 구독은 그 기기의 캘린더 앱과 주소 사이의 관계고 서버에는 아무 기록이 없다
// (주소는 로그인 없이 열리는 공개 피드다). 그래서 해제는 방법을 적어 두는 것이 전부다.
const UNSUBSCRIBE_STEPS = [
  {
    device: '아이폰 · 아이패드',
    // iOS 18 에서 설정 구조가 바뀌어 '앱' 아래로 들어갔다. 두 경로를 함께 적는다
    steps: '설정 → (앱 →) 캘린더 → 계정 → 구독한 캘린더 → 필사그래피 → 계정 삭제',
  },
  {
    device: '구글 캘린더',
    steps: '구글 캘린더 웹 → 왼쪽 [다른 캘린더] 목록에서 필사그래피 위에 마우스를 올리고 [×] (구독 취소)',
  },
  {
    device: 'Mac 캘린더',
    steps: '캘린더 앱 → 왼쪽 목록에서 필사그래피를 마우스 오른쪽 클릭 → 구독 해지',
  },
];

export default function CalendarFeedSection() {
  // 아이폰에서만 보이는 항목이다 (PM 결정). 판별은 마운트 뒤에 — 서버 렌더와 어긋나지 않게
  const [onIOS, setOnIOS] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');

  // 주소와 기기 판별은 브라우저에서만 알 수 있다 — 서버 렌더 결과와 어긋나지 않게 마운트 뒤에 채운다
  useEffect(() => {
    setOnIOS(isIOS());
    setFeedUrl(calendarFeedUrl());
  }, []);

  const copyFeedUrl = async () => {
    try {
      await navigator.clipboard.writeText(calendarFeedUrl());
      toast.success('구독 주소를 복사했어요');
    } catch {
      // 보안 컨텍스트가 아니거나 권한이 없는 경우 — 주소는 화면에 그대로 있으니 직접 고르면 된다
      toast.error('복사하지 못했어요. 주소를 길게 눌러 직접 복사해 주세요.');
    }
  };

  if (!onIOS) return null;

  return (
    <section className="flex flex-col gap-1">
      <h4 className="text-[13px] font-semibold tracking-[-0.02em] text-[#919191]">캘린더 구독</h4>
    <div className="rounded-[8px] border border-black/10 px-4 py-3">
      <p className="text-[14px] font-medium tracking-[-0.02em] text-[#212121]">아이폰 캘린더 구독</p>
      <p className="mt-0.5 text-[12px] leading-[1.5] tracking-[-0.02em] text-[#919191]">
        아이폰 기본 캘린더가 이 주소를 읽어 동아리 일정을 채워요. 구글 계정이 없어도 돼요.
      </p>

      {onIOS && (
        <a
          href={calendarWebcalUrl()}
          className="mt-2.5 flex h-[38px] w-full items-center justify-center rounded-[4px] bg-[#212121] text-[14px] text-white transition hover:bg-black"
        >
          아이폰 캘린더에 구독
        </a>
      )}

      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-[4px] bg-[#F5F5F5] px-2 py-1.5 text-[11px] text-[#454545]">
          {feedUrl || ' '}
        </code>
        <button
          type="button"
          onClick={copyFeedUrl}
          className="shrink-0 rounded-[4px] border border-[#DEDEDE] px-2.5 py-1.5 text-[12px] text-[#454545] transition hover:border-[#B9B9B9] hover:text-[#212121]"
        >
          복사
        </button>
      </div>

      <button
        type="button"
        onClick={() => setHelpOpen((prev) => !prev)}
        aria-expanded={helpOpen}
        className="mt-2.5 flex items-center gap-1 text-[12px] tracking-[-0.02em] text-[#919191] transition hover:text-[#212121]"
      >
        구독 해제하는 방법
        <ChevronDown
          size={14}
          className={`transition-transform ${helpOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {helpOpen && (
        <div className="mt-2 flex flex-col gap-2 border-t border-[#F0F0F0] pt-2.5">
          <p className="text-[12px] leading-[1.6] tracking-[-0.02em] text-[#757575]">
            구독은 기기의 캘린더 앱이 갖고 있어서 이 화면에서는 끊을 수 없어요. 쓰시는 캘린더에서
            지워주세요.
          </p>
          {UNSUBSCRIBE_STEPS.map(({ device, steps }) => (
            <div key={device}>
              <p className="text-[12px] font-medium tracking-[-0.02em] text-[#454545]">{device}</p>
              <p className="mt-0.5 text-[12px] leading-[1.6] tracking-[-0.02em] text-[#919191] [word-break:keep-all]">
                {steps}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
    </section>
  );
}
