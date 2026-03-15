'use client';

import { useState } from 'react';
import FindPwId from './FindPwId';
import FindPwEmail from './FindPwEmail';
import FindPwCode from './FindPwCode';
import FindPwReset from './FindPwReset';
import FindPwSuccess from './FindPwSuccess';

export default function FindPw() {
  /**
   * 단계(Step) 관리 상태
   * ID(1단계: 아이디 입력) -> EMAIL(2단계: 이메일 입력) -> CODE(3단계: 인증번호 확인)
   * -> RESET(4단계: 새 비밀번호 설정) -> SUCCESS(5단계: 변경 완료 안내)
   */
  const [step, setStep] = useState('ID');

  // 자식 컴포넌트 간 공유 및 API 호출에 필요한 사용자 정보 상태
  const [username, setUsername] = useState(''); // 사용자가 입력한 아이디
  const [email, setEmail] = useState(''); // 사용자가 입력한 본인 확인용 이메일

  // 1단계(아이디 입력) 완료 후 실행되는 핸들러
  const handleIdSubmit = (submittedUsername) => {
    setUsername(submittedUsername); // 입력받은 아이디 저장
    setStep('EMAIL'); // 이메일 입력 단계로 이동
  };

  // 2단계(이메일 입력 및 발송) 완료 후 실행되는 핸들러
  const handleEmailSubmit = (submittedEmail) => {
    setEmail(submittedEmail); // 입력받은 이메일 저장
    setStep('CODE'); // 인증번호 입력 단계로 이동
  };

  // 3단계(인증번호 확인) 검증 성공 시 실행되는 핸들러
  const handleCodeVerify = () => {
    setStep('RESET'); // 비밀번호 재설정 단계로 이동
  };

  // 4단계(비밀번호 재설정) API 연동 성공 시 실행되는 핸들러
  const handleReset = () => {
    setStep('SUCCESS'); // 최종 완료 화면으로 이동
  };

  /**
   * 뒤로 가기 핸들러: 사용자가 정보를 잘못 입력했을 경우 이전 단계로 복귀
   */
  const handleBackToId = () => setStep('ID'); // 이메일 입력창에서 아이디 입력창으로
  const handleBackToEmail = () => setStep('EMAIL'); // 인증번호 창에서 이메일 수정하러 이동

  return (
    // 전체 페이지 레이아웃: 최대 너비 설정 및 중앙 정렬
    <div className="mx-auto w-full max-w-[1280px] px-[80px] py-[80px]">
      <div className="mx-auto w-full max-w-[600px]">
        {/* 각 단계(step) 상태에 따라 해당 컴포넌트를 조건부 렌더링 */}

        {/* 1단계: 아이디 확인 */}
        {step === 'ID' && <FindPwId onNext={handleIdSubmit} />}

        {/* 2단계: 이메일 입력 및 인증 메일 발송 */}
        {step === 'EMAIL' && (
          <FindPwEmail loginId={username} onNext={handleEmailSubmit} onPrev={handleBackToId} />
        )}

        {/* 3단계: 인증번호 입력 및 검증 */}
        {step === 'CODE' && (
          <FindPwCode email={email} onNext={handleCodeVerify} onPrev={handleBackToEmail} />
        )}

        {/* 4단계: 새로운 비밀번호 설정 (저장된 username 사용) */}
        {step === 'RESET' && <FindPwReset username={username} onNext={handleReset} />}

        {/* 5단계: 비밀번호 변경 완료 안내 및 로그인 유도 */}
        {step === 'SUCCESS' && <FindPwSuccess />}
      </div>
    </div>
  );
}
