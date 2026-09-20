'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { BASE_PATH } from '@/constants/routes';

export default function LoginRestrictedSectionMobile({
  reason = '커뮤니티 운영정책 위반으로\n활동이 일시 정지되었습니다.',
  unlockAt = '2026.03.30 00:00',
}) {
  const router = useRouter();

  return (
    <section className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-[20px] px-[40px] py-[80px] text-center [word-break:keep-all]">
      <h2 className="text-[24px] font-semibold leading-[1.5] tracking-[-0.48px] text-[#212121]">
        로그인이 제한된 계정입니다
      </h2>
      <p className="whitespace-pre-line text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#212121]">
        {reason}
      </p>
      <p className="text-[16px] font-semibold leading-[1.6] tracking-[-0.32px] text-[#212121]">
        {unlockAt} 부터 다시 로그인 할 수 있습니다.
      </p>

      <Button
        type="button"
        className="h-[52px] w-full rounded-[4px] bg-[#212121] text-[16px] font-normal tracking-[-0.32px] text-white hover:bg-[#212121]/90"
        onClick={() => router.push(BASE_PATH)}
      >
        홈으로 돌아가기
      </Button>
    </section>
  );
}
