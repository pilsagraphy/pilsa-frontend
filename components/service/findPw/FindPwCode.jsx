'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { emailCodeSchema } from '@/schemas/auth';

export default function FindPwCode({ email, onNext, onPrev }) {
  // 입력된 인증번호 상태 관리
  const [code, setCode] = useState('');
  // 입력 필드 하단에 표시될 에러 메시지 상태
  const [error, setError] = useState('');
  // 서버 통신 중 버튼 중복 클릭 방지를 위한 로딩 상태
  const [loading, setLoading] = useState(false);
  // 성공 알림 후 페이지 전환을 위한 타이머 Ref
  const timerRef = useRef(null);

  // 컴포넌트 언마운트 시 실행 중인 타이머가 있다면 정리 (메모리 누수 방지)
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // 입력 값이 변경될 때 실행되는 핸들러
  const handleChange = (e) => {
    setCode(e.target.value);
    // 사용자가 다시 입력하기 시작하면 기존 에러 메시지 초기화
    if (error) setError('');
  };

  // 인증 버튼 클릭 시 실행되는 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault(); // 폼 제출 시 새로고침 방지
    if (loading) return; // 로딩 중에는 추가 실행 방지

    const result = emailCodeSchema.safeParse(code);

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      /**
       * 실제 백엔드 API와 통신하여 인증번호의 유효성을 검증하는 자리입니다.
       * 예: await api.verifyCode(email, code);
       */

      toast.success('인증이 완료되었습니다.', {
        description: '비밀번호 재설정 화면으로 이동합니다.',
      });

      // 성공 메시지를 보여준 뒤 1.5초 후 4단계(비밀번호 재설정)로 이동
      timerRef.current = setTimeout(() => {
        onNext();
      }, 1500);
    } catch (err) {
      // 인증번호 불일치 혹은 만료 시 처리
      toast.error('인증 실패', {
        description: '인증번호가 일치하지 않거나 만료되었습니다.',
      });
      setLoading(false); // 다시 입력할 수 있도록 로딩 해제
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-5 items-start w-full">
        {/* 단계 제목 */}
        <h1 className="font-semibold text-[24px] tracking-[-0.48px] leading-[1.5]">
          비밀번호 재설정
        </h1>

        <div className="flex flex-col gap-3 w-full">
          <p className="text-[16px] tracking-[-0.32px] leading-[1.6]">
            메일을 발송했어요. 인증번호를 입력해 주세요.
          </p>

          <div className="flex flex-col gap-[6px] w-full">
            {/* 인증번호 입력 필드 */}
            <Input
              type="text"
              value={code}
              onChange={handleChange}
              placeholder="인증번호 6자리"
              inputMode="numeric" // 모바일에서 숫자 키패드 활성화
              maxLength={6} // 최대 6글자 제한
              disabled={loading}
              // 에러 발생 시 테두리와 글자색을 빨간색(#f44336)으로 변경
              className={`h-[52px] text-[16px] ${
                error
                  ? 'border-[#f44336] text-[#f44336] focus-visible:ring-0 focus-visible:border-[#f44336]'
                  : ''
              }`}
            />
            {/* 에러가 있을 때만 하단에 메시지 노출 */}
            {error && (
              <p className="text-[#f44336] text-[12px] tracking-[-0.24px] leading-[1.4]">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* 인증 처리 버튼 */}
      <Button
        type="submit"
        disabled={loading}
        className="h-[52px] w-full bg-[#212121] hover:bg-[#424242] text-white text-[16px] transition-colors"
      >
        {loading ? '처리 중...' : '인증'}
      </Button>
    </form>
  );
}
