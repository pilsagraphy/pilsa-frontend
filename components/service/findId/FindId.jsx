'use client';

import { useState } from 'react';
import FindIdEmail from './FindIdEmail';
import FindIdCode from './FindIdCode';
import FindIdSuccess from './FindIdSuccess';

export default function FindId() {
  // 단계 관리 상태: EMAIL(1단계) -> CODE(2단계) -> SUCCESS(3단계)
  const [step, setStep] = useState('EMAIL');
  // 자식 컴포넌트들끼리 공유해야 할 데이터 상태
  const [email, setEmail] = useState(''); // 1단계에서 입력받은 이메일
  const [foundId, setFoundId] = useState(''); // 2단계에서 서버로부터 받은 아이디

  // 1단계 -> 2단계 이동 함수
  const handleEmailSubmit = (submittedEmail) => {
    setEmail(submittedEmail);
    setStep('CODE');
  };

  // 2단계 -> 3단계 이동 함수
  const handleCodeVerify = (userId) => {
    setFoundId(userId);
    setStep('SUCCESS');
  };

  // 2단계 -> 1단계로 되돌리기 (사용자가 이메일을 오입력했을 경우)
  const handleBackToEmail = () => {
    setStep('EMAIL');
  };

  return (
    // 전체 페이지의 여백과 중앙 정렬 레이아웃을 여기서 정리
    <div className="mx-auto w-full max-w-[1280px] px-[80px] py-[80px]">
      <div className="mx-auto w-full max-w-[600px]">
        {step === 'EMAIL' && <FindIdEmail onNext={handleEmailSubmit} />}

        {step === 'CODE' && (
          <FindIdCode email={email} onNext={handleCodeVerify} onPrev={handleBackToEmail} />
        )}

        {step === 'SUCCESS' && <FindIdSuccess userId={foundId} />}
      </div>
    </div>
  );
}
