'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

/**
 * 비밀번호 유효성 검사 정규식
 * 영문, 숫자, 특수문자를 각각 최소 1개 이상 포함하며 8자 이상이어야 함
 */
const isValidPassword = (v) =>
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(v);

export default function FindPwReset({ username, onNext }) {
  // 입력 상태 관리
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 개별 에러 메시지 상태 관리
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // 로딩 및 타이머 설정
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // 언마운트 시 타이머 정리
  useEffect(() => () => clearTimeout(timerRef.current), []);

  /**
   * 신규 비밀번호 입력 핸들러
   * 입력 시 실시간으로 해당 필드의 에러 메시지를 초기화함
   */
  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    if (newPasswordError) setNewPasswordError('');
  };

  /**
   * 비밀번호 확인 입력 핸들러
   */
  const handleConfirmChange = (e) => {
    setConfirmPassword(e.target.value);
    if (confirmError) setConfirmError('');
  };

  /**
   * 비밀번호 변경 제출 핸들러
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    let hasError = false;

    // 1. 신규 비밀번호 유효성 검사 (복합 규격 확인)
    if (!newPassword.trim() || !isValidPassword(newPassword)) {
      setNewPasswordError('비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.');
      hasError = true;
    }

    // 2. 비밀번호 일치 여부 확인
    if (!confirmPassword.trim() || newPassword !== confirmPassword) {
      setConfirmError('비밀번호가 일치하지 않습니다.');
      hasError = true;
    }

    // 에러가 하나라도 있으면 중단
    if (hasError) return;

    setLoading(true);
    try {
      // 실제 API 호출이 들어갈 자리
      // await api.resetPassword({ username, newPassword });

      toast.success('비밀번호가 변경되었습니다.');

      timerRef.current = setTimeout(() => {
        onNext();
      }, 1500);
    } catch (err) {
      toast.error('변경 실패', {
        description: '서버 오류가 발생했습니다.',
      });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 items-end w-full">
      <div className="flex flex-col gap-5 items-start w-full">
        <h1 className="font-semibold text-[24px] text-[#454545] tracking-[-0.48px] leading-[1.5]">
          비밀번호를 재설정해주세요
        </h1>

        <div className="flex flex-col gap-3 w-full">
          {/* 신규 비밀번호 입력 섹션 */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-[#454545] text-[16px] tracking-[-0.32px] leading-[1.6]">
              신규 비밀번호
            </p>
            <div className="flex flex-col gap-[6px] w-full">
              <Input
                type="password"
                value={newPassword}
                onChange={handleNewPasswordChange}
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                disabled={loading}
                // 에러 발생 시 테두리 및 텍스트 색상 변경 (피그마 디자인 반영)
                className={`h-[52px] text-[16px] ${
                  newPasswordError
                    ? 'border-[#f44336] text-[#f44336] focus-visible:ring-0 focus-visible:border-[#f44336]'
                    : ''
                }`}
              />
              {newPasswordError && (
                <p className="text-[#f44336] text-[12px] tracking-[-0.24px] leading-[1.4]">
                  {newPasswordError}
                </p>
              )}
            </div>
          </div>

          {/* 비밀번호 재입력 확인 섹션 */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-[#454545] text-[16px] tracking-[-0.32px] leading-[1.6]">
              비밀번호 재입력
            </p>
            <div className="flex flex-col gap-[6px] w-full">
              <Input
                type="password"
                value={confirmPassword}
                onChange={handleConfirmChange}
                placeholder="비밀번호 재입력"
                disabled={loading}
                className={`h-[52px] text-[16px] ${
                  confirmError
                    ? 'border-[#f44336] text-[#f44336] focus-visible:ring-0 focus-visible:border-[#f44336]'
                    : ''
                }`}
              />
              {confirmError && (
                <p className="text-[#f44336] text-[12px] tracking-[-0.24px] leading-[1.4]">
                  {confirmError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-[52px] w-full bg-[#212121] hover:bg-[#424242] text-white text-[16px] transition-colors"
      >
        {loading ? '처리 중...' : '비밀번호 재설정'}
      </Button>
    </form>
  );
}
