'use client';

import { Button } from '@/components/ui/button';

export default function LoginBannedSectionMobile({
  reason = '커뮤니티 운영정책 위반으로\n활동이 영구 정지되었습니다.',
  onContact,
}) {
  return (
    <section className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-[20px] px-[40px] py-[80px] text-center [word-break:keep-all]">
      <h2 className="text-[24px] font-semibold leading-[1.5] tracking-[-0.48px] text-[#212121]">
        로그인이 영구 제한된 계정입니다
      </h2>
      <p className="whitespace-pre-line text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
        {reason}
      </p>
      <p className="text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
        본 조치에 이의가 있으시면 운영진에게 문의해주세요.
      </p>

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
