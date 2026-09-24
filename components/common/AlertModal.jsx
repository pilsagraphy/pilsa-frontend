'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * 닫기 버튼만 있는 안내 모달
 * description에 줄바꿈(\n)을 넣으면 그대로 표시된다.
 */
export default function AlertModal({
  open,
  title,
  description,
  closeText = '닫기',
  onClose,
  // #183 모바일에서 모달 높이를 피그마에 맞추기 위한 본문 영역 최소 높이(px 숫자).
  // 데스크톱은 아래 래퍼가 md:contents 라 box 가 없어 이 minHeight 는 무시된다.
  mobileBodyMinHeight = 0,
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      {/* #183 모바일은 피그마(다크 테두리·362px·제목 볼드 #454545·본문 16px),
          데스크톱(md↑)은 기존 스타일 그대로 */}
      <DialogContent
        hideCloseButton
        className="max-w-[362px] gap-[12px] rounded-[4px] border-[#212121] px-[16px] py-[24px] md:max-w-[340px] md:gap-[20px] md:border-[#dedede] md:p-[24px]"
      >
        {/* 모바일: 제목+본문을 한 덩어리로 묶어 min-height 로 피그마 높이를 맞춘다.
            데스크톱: md:contents 로 래퍼가 사라져 기존(제목·본문이 그리드 자식) 그대로. */}
        <div
          className="flex w-full flex-col justify-center gap-[12px] md:contents"
          style={mobileBodyMinHeight ? { minHeight: `${mobileBodyMinHeight}px` } : undefined}
        >
          <DialogTitle className="text-center text-[16px] font-bold leading-[1.6] tracking-[-0.32px] text-[#454545] md:font-semibold md:text-[#212121]">
            {title}
          </DialogTitle>

          {description && (
            <DialogDescription className="whitespace-pre-line text-center text-[16px] leading-[1.6] tracking-[-0.32px] text-[#454545] md:text-[14px] md:tracking-[-0.28px]">
              {description}
            </DialogDescription>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-center sm:justify-center sm:space-x-0">
          <Button
            type="button"
            onClick={onClose}
            className="h-[48px] w-[87px] rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242]"
          >
            {closeText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
