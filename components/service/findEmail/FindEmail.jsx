'use client';

import { useState } from 'react';
import FindEmailVerify from './FindEmailVerify';
import FindEmailSuccess from './FindEmailSuccess';

export default function FindEmail() {
  // 단계 관리 상태: FORM(1단계) -> RESULT(2단계)
  const [step, setStep] = useState('FORM');
  // 1단계에서 인증 후 조회된 이메일 (자식 컴포넌트끼리 공유)
  const [email, setEmail] = useState('');

  // 1단계 -> 2단계 이동 함수
  const handleVerified = (foundEmail) => {
    setEmail(foundEmail);
    setStep('RESULT');
  };

  return (
    // 전체 페이지의 여백과 중앙 정렬 레이아웃 (findId와 동일 패턴)
    <div className="mx-auto w-full max-w-[1280px] px-[80px] py-[80px]">
      <div className="mx-auto w-full max-w-[600px]">
        {step === 'FORM' && <FindEmailVerify onNext={handleVerified} />}

        {step === 'RESULT' && <FindEmailSuccess email={email} />}
      </div>
    </div>
  );
}
