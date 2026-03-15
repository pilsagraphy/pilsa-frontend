'use client';

import { useRouter } from 'next/navigation'; // 1. 라우터 임포트
import { Button } from '@/components/ui/button';

const SELECTION_OPTIONS = [
  { id: 'student', label: '재학생입니다' },
  { id: 'graduate', label: '졸업생입니다' },
];

export default function PreSignup() {
  const router = useRouter(); // 2. 라우터 인스턴스 생성
  const handleSelection = (type) => {
    // 3. /signup/form 페이지로 이동하면서 쿼리 스트링(?role=...) 추가
    router.push(`/signup/form?role=${type}`);
  };

  return (
    <div className="flex size-full items-center justify-center py-20 font-pretendard">
      <div className="flex w-[600px] flex-col gap-[33px]">
        <h1 className="text-[24px] font-semibold leading-[1.5] tracking-[-0.48px] text-black">
          현재 학교를 다니고 계신가요?
        </h1>
        <div className="flex flex-col gap-3">
          {SELECTION_OPTIONS.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              onClick={() => handleSelection(option.id)}
              className="h-[52px] w-full border-[#b9b9b9] text-[16px] font-normal text-[#212121] transition-colors hover:bg-[#212121] hover:text-white"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
