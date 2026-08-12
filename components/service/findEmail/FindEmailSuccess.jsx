'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export default function FindEmailSuccess({ email }) {
  const router = useRouter();

  // 이메일 클립보드 복사
  // 모바일 웹뷰는 텍스트 길게 눌러 선택하는 것이 막혀 있는 경우가 있어 버튼으로 제공한다.
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success('이메일이 복사되었습니다.');
    } catch {
      // http 환경이나 구형 웹뷰에서는 클립보드 API를 못 쓸 수 있다
      toast.error('복사하지 못했습니다.', {
        description: '이메일을 직접 선택해 복사해 주세요.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-[50px] items-start w-full">
        {/* 제목 + 안내 문구 */}
        <div className="flex flex-col gap-[6px] w-full">
          <h1 className="font-semibold text-[24px] text-black tracking-[-0.48px] leading-[1.5]">
            이메일 찾기
          </h1>
          <p className="text-[#b9b9b9] text-[16px] tracking-[-0.32px] leading-[1.6]">
            회원님의 가입 이메일은 아래와 같습니다.
          </p>
        </div>

        {/* 조회된 이메일 표시 (시안대로 #dedede 채움, 테두리 없음) + 복사 버튼 */}
        <div className="relative w-full">
          <div className="bg-[#dedede] h-[52px] rounded-[4px] flex items-center px-[16px] pr-[52px]">
            <span className="truncate text-[#212121] text-[16px] tracking-[-0.32px] leading-[1.6]">
              {email}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="이메일 복사"
            className="absolute right-[16px] top-1/2 -translate-y-1/2 text-[#454545] transition-colors hover:text-[#212121]"
          >
            <Copy size={20} aria-hidden />
          </button>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex flex-col gap-5 w-full">
        <Button
          onClick={() => router.push(ROUTES.LOGIN)}
          className="h-[52px] w-full bg-[#212121] hover:bg-[#424242] text-white text-[16px] transition-colors"
        >
          로그인 하러가기
        </Button>
        <Button
          onClick={() => router.push(ROUTES.FIND_PW)}
          variant="outline"
          className="h-[52px] w-full border-[#212121] text-[#212121] text-[16px] transition-colors hover:bg-gray-50"
        >
          비밀번호 찾기
        </Button>
      </div>
    </div>
  );
}
