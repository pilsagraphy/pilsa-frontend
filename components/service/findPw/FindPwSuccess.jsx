'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function FindPwSuccess() {
  // 페이지 이동을 위한 Next.js router 훅
  const router = useRouter();

  return (
    // 전체 레이아웃: 버튼을 하단/우측에 배치하기 위한 flex 설정
    <div className="flex flex-col gap-10 items-end w-full">
      {/* 텍스트 메시지 섹션 */}
      <div className="flex flex-col gap-5 items-start w-full">
        <h1 className="font-semibold text-[24px] tracking-[-0.48px] leading-[1.5]">
          비밀번호 재설정이 완료되었습니다.
        </h1>
      </div>

      {/* 하단 버튼 섹션 */}
      <div className="flex flex-col gap-3 w-full">
        <Button
          // 클릭 시 로그인 페이지('/login')로 이동
          onClick={() => router.push('/login')}
          // 디자인 시스템에 맞춘 버튼 스타일 (검은색 배경, 흰색 글자, 높이 52px)
          className="h-[52px] w-full bg-[#212121] hover:bg-[#424242] text-white text-[16px] transition-colors"
        >
          로그인 하러가기
        </Button>
      </div>
    </div>
  );
}
