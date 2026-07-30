'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default function FindEmailSuccess({ email }) {
  const router = useRouter();

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

        {/* 조회된 이메일 표시 (회색 비활성 필드) */}
        <div className="w-full">
          <div className="bg-[#dedede] h-[52px] rounded-[4px] flex items-center px-[16px]">
            <span className="text-[#212121] text-[16px] tracking-[-0.32px] leading-[1.6]">
              {email}
            </span>
          </div>
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
