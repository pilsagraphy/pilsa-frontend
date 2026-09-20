'use client';

import { useEffect, useState } from 'react';
import { CalendarPlus } from 'lucide-react';

import { googleCalendarUrl, icsUrl, prefersIcs } from '@/lib/addToCalendar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

// 일정 하나만 내 캘린더에 담기.
//
// 구독(전체 일정)과 다른 길이다 — 이 일정 하나만 들어가고, 나중에 동아리가 일정을 고쳐도 따라 바뀌지 않는다.
// 그래서 안내에 그 차이를 적어 둔다. 계속 따라오길 원하는 사람은 위의 [내 캘린더에 구독]을 써야 한다.
//
// 기기마다 되는 방법이 달라 권하는 순서를 바꾼다 (자세한 이유는 lib/addToCalendar.js):
//  - 아이폰·아이패드·맥 : 캘린더 파일(.ics)이 곧바로 '추가' 창을 띄운다
//  - 안드로이드·PC      : 구글 캘린더의 추가 화면이 한 번에 끝난다 (.ics 는 다운로드로 끝나 다시 열어야 한다)
export default function AddSingleEventDialog({ schedule, open, onClose }) {
  const [onApple, setOnApple] = useState(false);

  useEffect(() => {
    setOnApple(prefersIcs());
  }, []);

  if (!schedule) return null;

  const primaryBtn =
    'h-[48px] w-full rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242]';
  const outlineBtn = 'h-[48px] w-full rounded-[4px] border-[#b9b9b9] text-[16px] text-[#212121]';

  const openGoogle = () => {
    window.open(googleCalendarUrl(schedule), '_blank', 'noopener,noreferrer');
    onClose?.();
  };

  // .ics 는 새 창이 아니라 현재 창에서 연다 — 새 창으로 열면 빈 탭만 남고 캘린더가 안 뜨는 기기가 있다
  const openIcs = () => {
    window.location.href = icsUrl(schedule.scheduleId);
    onClose?.();
  };

  // 두 번째 버튼이 검정 바탕에 검정 글자로 보였다 — 테두리 모양 클래스만 주고 variant 를 안 줘서
  // 기본(채움) 배경이 남아 있었다. 모양을 바꾸는 쪽은 variant 도 같이 바꾼다
  const googleButton = (
    <Button
      type="button"
      variant={onApple ? 'outline' : 'default'}
      onClick={openGoogle}
      className={onApple ? outlineBtn : primaryBtn}
    >
      구글 캘린더에 추가
    </Button>
  );
  const icsButton = (
    <Button
      type="button"
      variant={onApple ? 'default' : 'outline'}
      onClick={openIcs}
      className={onApple ? primaryBtn : outlineBtn}
    >
      캘린더 앱에 추가
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent
        hideCloseButton
        className="max-w-[380px] gap-[20px] rounded-[4px] border-[#dedede] p-[24px]"
      >
        <DialogTitle className="flex items-center justify-center gap-2 text-center text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-[#212121] [word-break:keep-all]">
          <CalendarPlus size={18} aria-hidden />이 일정만 담기
        </DialogTitle>
        <DialogDescription className="text-center text-[14px] leading-[1.7] tracking-[-0.28px] text-[#454545] [word-break:keep-all]">
          <strong className="font-semibold text-[#212121]">{schedule.title}</strong> 일정을 내
          캘린더에 넣어요. 한 번만 담는 것이라 동아리가 나중에 일정을 바꿔도 따라 바뀌지 않아요.
          계속 따라오게 하려면 위의 [내 캘린더에 구독]을 써주세요.
        </DialogDescription>

        <DialogFooter className="flex flex-col gap-[8px] sm:flex-col sm:space-x-0">
          {/* 애플 기기: 캘린더 파일이 곧바로 '추가' 창을 띄우니 그걸 앞에, 구글은 뒤에.
              그 외(안드로이드·PC): .ics 는 다운로드로 끝나 파일을 다시 열어야 한다 — 그런 버튼은 없는 게 낫다.
              구글 캘린더 추가 화면 하나만 둔다 (크롬·삼성 인터넷·엣지 모두 한 번에 열린다) */}
          {onApple ? icsButton : null}
          {googleButton}
          <Button type="button" variant="outline" onClick={onClose} className={outlineBtn}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
