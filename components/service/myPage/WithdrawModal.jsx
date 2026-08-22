'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { UserX, FileText, BellOff, CalendarClock, ShieldAlert, CircleCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { withdrawAccount } from '@/apis/mypage';
import { getErrorMessage } from '@/apis/auth';
import { AUTO_LOGIN_KEY } from '@/stores/useAuthStore';
import { BASE_PATH } from '@/constants/routes';

// 탈퇴 시 처리 내용 안내
const NOTICE_ITEMS = [
  {
    icon: UserX,
    text: '이름·이메일·아이디·전화번호 등 개인정보는 즉시 파기됩니다.',
  },
  {
    icon: FileText,
    text: '작성하신 글과 댓글은 남지만, 작성자가 "탈퇴한 회원"으로 표시됩니다.',
  },
  {
    icon: BellOff,
    text: '이 계정으로 알림을 받던 모든 기기의 알림 수신이 해제됩니다.',
  },
  {
    icon: CalendarClock,
    text: '탈퇴 후 30일 동안은 같은 학번으로 재가입할 수 없습니다.',
  },
  {
    icon: ShieldAlert,
    text: '이용 제한(정지·차단) 중 탈퇴한 경우, 제한이 끝날 때까지 재가입이 제한됩니다.',
  },
];

// 회원 탈퇴 모달 — 3단계 플로우 (안내·동의 → 비밀번호 확인 → 완료)
export default function WithdrawModal({ open, onOpenChange }) {
  const [step, setStep] = useState(1); // 1: 안내, 2: 비밀번호 확인, 3: 완료
  const [agreed, setAgreed] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(1);
    setAgreed(false);
    setPassword('');
    setSubmitting(false);
  };

  const handleOpenChange = (next) => {
    if (submitting) return; // 처리 중에는 닫기 방지
    if (step === 3) return; // 완료 후에는 [홈으로] 버튼으로만 이탈 (반쯤 로그인된 화면 방지)
    if (!next) reset();
    onOpenChange(next);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!password || submitting) return;

    setSubmitting(true);
    try {
      await withdrawAccount(password);

      try {
        localStorage.removeItem(AUTO_LOGIN_KEY);
      } catch {
        // ignore
      }
      setSubmitting(false);
      setStep(3);
    } catch (err) {
      toast.error(getErrorMessage(err, '탈퇴 처리에 실패했습니다.'));
      setSubmitting(false);
    }
  };

  // 완료 화면의 홈 이동 — 전체 리로드로 인증 상태·모달 스택을 확실히 초기화
  const goHome = () => {
    window.location.replace(BASE_PATH);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[400px] rounded-[12px] p-6"
        overlayClassName="bg-transparent"
        hideCloseButton
      >
        {step === 1 ? (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="text-[18px] tracking-[-0.02em] text-black">
                회원 탈퇴
              </DialogTitle>
              <DialogDescription className="text-[13px] tracking-[-0.02em] text-[#757575]">
                탈퇴하기 전에 아래 내용을 꼭 확인해주세요.
              </DialogDescription>
            </DialogHeader>

            <ul className="flex flex-col gap-3 rounded-[8px] bg-[#FAFAFA] p-4">
              {NOTICE_ITEMS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon size={16} className="mt-0.5 shrink-0 text-[#757575]" />
                  <span className="text-[13px] leading-[1.6] tracking-[-0.02em] text-[#454545] [word-break:keep-all]">
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            <label className="flex cursor-pointer select-none items-center gap-2 text-[13px] tracking-[-0.02em] text-[#212121]">
              <Checkbox
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="border-[#c4c4c4] data-[state=checked]:bg-[#212121] data-[state=checked]:border-[#212121]"
              />
              위 내용을 모두 확인했으며 이에 동의합니다.
            </label>

            <div className="mt-1 flex flex-col gap-2">
              <Button
                type="button"
                disabled={!agreed}
                onClick={() => setStep(2)}
                className="h-[46px] w-full rounded-[6px] bg-[#212121] text-[15px] font-semibold text-white hover:bg-black disabled:opacity-40"
              >
                계속하기
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="h-[42px] w-full rounded-[6px] text-[14px] text-[#919191] hover:text-[#454545]"
              >
                취소
              </Button>
            </div>
          </>
        ) : step === 2 ? (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="text-[18px] tracking-[-0.02em] text-black">
                본인 확인
              </DialogTitle>
              <DialogDescription className="text-[13px] tracking-[-0.02em] text-[#757575]">
                안전한 탈퇴 처리를 위해 현재 비밀번호를 입력해주세요.
              </DialogDescription>
            </DialogHeader>

            {/* autoComplete off + new-password — 저장된 비밀번호를 채워 넣거나 힌트를 띄우지 않게 막는다 */}
            <form onSubmit={handleWithdraw} autoComplete="off" className="flex flex-col gap-4">
              <Input
                required
                autoFocus
                type="password"
                placeholder="현재 비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                spellCheck={false}
                className="h-[48px] rounded-[6px] border-[#c4c4c4] text-[15px]"
              />

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={!password || submitting}
                  className="h-[46px] w-full rounded-[6px] bg-[#212121] text-[15px] font-semibold text-white hover:bg-black disabled:opacity-40"
                >
                  {submitting ? '처리 중...' : '탈퇴하기'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={submitting}
                  onClick={() => setStep(1)}
                  className="h-[42px] w-full rounded-[6px] text-[14px] text-[#919191] hover:text-[#454545]"
                >
                  이전으로
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* 3단계: 완료 안내 */}
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CircleCheck size={44} strokeWidth={1.5} className="text-[#212121]" />
              <DialogHeader>
                <DialogTitle className="text-center text-[18px] tracking-[-0.02em] text-black">
                  탈퇴가 완료되었습니다
                </DialogTitle>
                <DialogDescription className="text-center text-[13px] leading-[1.6] tracking-[-0.02em] text-[#757575] [word-break:keep-all]">
                  그동안 필사그래피와 함께해주셔서 감사합니다.
                  <br />
                  언제든 다시 만나요!
                </DialogDescription>
              </DialogHeader>
            </div>

            <Button
              type="button"
              onClick={goHome}
              className="h-[46px] w-full rounded-[6px] bg-[#212121] text-[15px] font-semibold text-white hover:bg-black"
            >
              홈으로 돌아가기
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
