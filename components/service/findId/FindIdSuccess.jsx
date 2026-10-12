'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { Copy } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export default function FindIdSuccess({ userId = '' }) {
  const router = useRouter();

  // 아이디 클립보드 복사
  const handleCopy = () => {
    navigator.clipboard.writeText(userId);
    toast.success('아이디가 복사되었습니다.');
  };

  return (
    <div className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-5 items-start w-full">
        <h1 className="font-semibold text-[24px] tracking-[-0.48px] leading-[1.5]">
          아이디를 찾았어요
        </h1>
        <div className="flex flex-col gap-3 w-full">
          <p className="text-[16px] tracking-[-0.32px] leading-[1.6]">회원님의 아이디는</p>

          {/* 아이디 표시 필드 + 복사 버튼 */}
          <div className="relative w-full">
            <div className="bg-surface-2 h-[52px] rounded-[4px] flex items-center px-[16px] pr-[52px] border border-line">
              <span className="text-ink text-[16px] tracking-[-0.32px] leading-[1.6]">
                {userId}
              </span>
            </div>
            {/* 복사 버튼 */}
            <button
              onClick={handleCopy}
              type="button"
              aria-label="아이디 복사"
              className="absolute right-[16px] top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex flex-col gap-3 w-full">
        <Button
          onClick={() => router.push(ROUTES.LOGIN)}
          className="h-[52px] w-full bg-inverse hover:bg-inverse-2 text-inverse-fg text-[16px] transition-colors"
        >
          로그인 하러가기
        </Button>
        <Button
          onClick={() => router.push(ROUTES.FIND_PW)} // '/findPw' 로 보내 404 가 나던 것 (실제 경로 /findPassword)
          variant="outline"
          className="h-[52px] w-full border-line-strong text-ink text-[16px] transition-colors hover:bg-surface-2"
        >
          비밀번호 찾기
        </Button>
      </div>
    </div>
  );
}
