'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function FindPwId({ onNext }) {
  // 사용자가 입력한 아이디를 관리하는 상태
  const [username, setUsername] = useState('');
  // API 요청 등 비동기 작업 중 버튼 비활성화를 위한 로딩 상태
  const [loading, setLoading] = useState(false);
  // 페이지 이동 전 딜레이나 타이머 관리를 위한 Ref
  const timerRef = useRef(null);

  // 컴포넌트가 언마운트(페이지 전환 등)될 때 실행 중인 타이머를 제거하여 메모리 누수 방지
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // 폼 제출(다음 버튼 클릭) 핸들러
  const handleSubmit = async (e) => {
    // 폼 제출 시 페이지가 새로고침되는 기본 동작 방지
    e.preventDefault();

    // 이미 로딩 중이면 중복 제출 방지
    if (loading) return;

    // 유효성 검사: 아이디 입력 여부 확인
    if (!username.trim()) {
      toast.error('아이디를 입력해 주세요.', {
        description: '회원가입 시 등록한 아이디를 입력해 주세요.',
      });
      return;
    }

    setLoading(true);
    try {
      /**
       * 실제 서비스에서는 여기서 아이디 존재 여부를 확인하는 API 호출이 필요합니다.
       * 예: await api.checkUsername(username);
       */

      // 시각적인 피드백을 위해 약간의 지연 시간(0.5초) 후 다음 단계로 이동
      timerRef.current = setTimeout(() => {
        onNext(username); // 부모 컴포넌트에 입력받은 username 전달 및 단계 이동
      }, 500);
    } catch (error) {
      // 아이디가 없거나 서버 에러 발생 시 처리
      toast.error('확인 실패', {
        description: '등록되지 않은 아이디이거나 서버 오류가 발생했습니다.',
      });
      setLoading(false); // 다시 시도할 수 있도록 로딩 해제
    }
  };

  return (
    // 폼 레이아웃: 하단에 버튼을 배치하기 위해 items-end 사용
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-5 items-start w-full">
        {/* 제목 섹션 */}
        <h1 className="font-semibold text-[24px] tracking-[-0.48px] leading-[1.5]">
          비밀번호 재설정
        </h1>

        {/* 입력 섹션 */}
        <div className="flex flex-col gap-3 w-full">
          <p className="text-[16px] tracking-[-0.32px] leading-[1.6]">
            회원가입 시 등록했던 아이디를 입력해 주세요.
          </p>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="아이디"
            autoComplete="username"
            disabled={loading} // 로딩 중에는 입력창 비활성화
            className="h-[52px] text-[16px]"
          />
        </div>
      </div>

      {/* 제출 버튼: 로딩 상태에 따라 텍스트 변경 */}
      <Button
        type="submit"
        disabled={loading}
        className="h-[52px] w-full bg-[#212121] hover:bg-[#424242] text-white text-[16px] transition-colors"
      >
        {loading ? '확인 중...' : '다음'}
      </Button>
    </form>
  );
}
