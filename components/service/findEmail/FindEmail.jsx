'use client';

import { useState } from 'react';
import FindEmailId from './FindEmailId';
import FindEmailSuccess from './FindEmailSuccess';

export default function FindEmail() {
  // 단계 관리 상태: INPUT(1단계) -> SUCCESS(2단계)
  const [step, setStep] = useState('INPUT');
  // 조회된 이메일 (2단계에서 표시)
  const [foundEmail, setFoundEmail] = useState('');

  // 1단계 -> 2단계 이동 함수
  const handleSuccess = (email) => {
    setFoundEmail(email);
    setStep('SUCCESS');
  };

  return (
    // 전체 페이지의 여백과 중앙 정렬 레이아웃 (findId 페이지와 동일)
    <div className="mx-auto w-full max-w-[1280px] px-[80px] py-[80px]">
      <div className="mx-auto w-full max-w-[600px]">
        {step === 'INPUT' && <FindEmailId onNext={handleSuccess} />}

        {step === 'SUCCESS' && <FindEmailSuccess email={foundEmail} />}
      </div>
    </div>
  );
}
