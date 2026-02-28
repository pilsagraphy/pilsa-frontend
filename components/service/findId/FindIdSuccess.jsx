'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

export default function FindIdSuccess({ userId = 'pilsa1234' }) {
  // 일단 하드 코딩
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
            <div className="bg-[#f5f5f5] h-[52px] rounded-[4px] flex items-center px-[16px] pr-[52px] border border-[#dedede]">
              <span className="text-[#212121] text-[16px] tracking-[-0.32px] leading-[1.6]">
                {userId}
              </span>
            </div>
            {/* 복사 버튼 */}
            <button
              onClick={handleCopy}
              type="button"
              aria-label="아이디 복사"
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
          onClick={() => router.push('/login')}
          className="h-[52px] w-full bg-[#212121] hover:bg-[#424242] text-white text-[16px] transition-colors"
        >
          로그인 하러가기
        </Button>
        <Button
          onClick={() => router.push('/findPw')}
          variant="outline"
          className="h-[52px] w-full border-[#b9b9b9] text-[#212121] text-[16px] transition-colors hover:bg-gray-50"
        >
          비밀번호 찾기
        </Button>
      </div>
    </div>
  );
}
