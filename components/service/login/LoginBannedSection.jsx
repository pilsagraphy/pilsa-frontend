'use client';

import { Button } from '@/components/ui/button';

export default function LoginBannedSection({
  reason = '커뮤니티 운영정책 위반으로 활동 이용이 영구적으로 중단되었습니다.',
  onContact,
}) {
  return (
    <section className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-[50px] px-4 py-[80px]">
      <div className="flex flex-col items-center gap-[45px] text-center [word-break:keep-all]">
        <h2 className="text-[26px] font-semibold leading-[1.5] tracking-[-0.48px] text-black">
          로그인이 영구적으로 제한된 계정입니다
        </h2>
        <div className="space-y-1 text-[18px] leading-[1.6] tracking-[-0.32px] text-[#212121]">
          <p className="font-normal">{reason}</p>
          <p className="font-normal">본 조치에 이의가 있으시면 운영진에게 문의해주세요.</p>
        </div>
      </div>

      <Button
        type="button"
        className="h-[52px] w-full rounded-[4px] bg-[#212121] text-[16px] font-normal tracking-[-0.32px] text-white hover:bg-[#212121]/90"
        onClick={onContact}
      >
        관리자에게 문의하기
      </Button>
    </section>
  );
}
