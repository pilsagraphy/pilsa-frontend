'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export default function FindEmailSuccess({ email = '' }) {
  const router = useRouter();
  const displayEmail = email || '등록된 이메일을 확인할 수 없습니다.';

  // 이메일 클립보드 복사
  const handleCopy = () => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    toast.success('이메일이 복사되었습니다.');
  };

  return (
    <div className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-5 items-start w-full">
        <h1 className="font-semibold text-[24px] tracking-[-0.48px] leading-[1.5]">
          이메일을 찾았어요
        </h1>
        <div className="flex flex-col gap-3 w-full">
          <p className="text-[16px] tracking-[-0.32px] leading-[1.6]">회원님의 이메일은</p>

          {/* 이메일 표시 필드 + 복사 버튼 */}
          <div className="relative w-full">
            <div className="bg-[#f5f5f5] h-[52px] rounded-[4px] flex items-center px-[16px] pr-[52px] border border-[#dedede]">
              <span className="text-[#212121] text-[16px] tracking-[-0.32px] leading-[1.6]">
                {displayEmail}
              </span>
            </div>
            {/* 복사 버튼 */}
            <button
              onClick={handleCopy}
              type="button"
              aria-label="이메일 복사"
              className="absolute right-[16px] top-1/2 -translate-y-1/2 text-[#9e9e9e] hover:text-[#212121] transition-colors"
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
          className="h-[52px] w-full bg-[#212121] hover:bg-[#424242] text-white text-[16px] transition-colors"
        >
          로그인 하러가기
        </Button>
        <Button
          onClick={() => router.push(ROUTES.FIND_PW)}
          variant="outline"
          className="h-[52px] w-full border-[#b9b9b9] text-[#212121] text-[16px] transition-colors hover:bg-gray-50"
        >
          비밀번호 찾기
        </Button>
      </div>
    </div>
  );
}
