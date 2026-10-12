'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * [구글로 로그인] 했는데 그 구글 계정에 연결된 회원이 없을 때 묻는 모달.
 *
 *  - 같은 이메일로 가입된 회원이 있으면: "이미 가입된 계정이에요 — 연결할까요?"
 *    → 본인 확인을 위해 아이디·비밀번호로 로그인하면 그 자리에서 연결된다 (LoginSection.handleLogin)
 *  - 없으면: "회원가입으로 진행할까요?" → 가입을 마치고 로그인하면 연결된다.
 *    다른 이메일로 이미 가입한 회원이면 그냥 로그인해도 연결된다.
 *
 * 연결하지 않겠다고 하면 서버의 대기 정보를 지운다(onDecline) — 남겨 두면 10분 안에
 * 다른 아이디로 로그인할 때 그 계정에 붙어 버린다.
 */
// providerLabel: 구글 · 네이버 · 카카오 — 네이버·카카오 로그인도 같은 모달을 쓴다 (2026-10-11)
export default function GoogleLinkDialog({ open, pending, onAccept, onSignup, onDecline, providerLabel = '구글' }) {
  if (!pending) return null;
  const label = providerLabel;
  const { emailMatched, maskedEmail, maskedLoginId } = pending;

  // 바깥 클릭·ESC 는 모달만 닫는다(onAccept: 대기 유지, 배너만 남음). 실수로 닫았는데 10분 보관이 사라지면 소셜 로그인부터 다시 해야 한다 (감사 2026-10-13)
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onAccept?.()}>
      <DialogContent
        hideCloseButton
        className="max-w-[380px] gap-[20px] rounded-[4px] border-line p-[24px]"
      >
        <DialogTitle className="text-center text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-ink">
          {emailMatched ? '이미 가입된 계정이에요' : '가입된 회원을 찾지 못했어요'}
        </DialogTitle>

        <DialogDescription className="text-center text-[14px] leading-[1.7] tracking-[-0.28px] text-ink-2 [word-break:keep-all]">
          {emailMatched ? (
            <>
              같은 이메일로 가입한 아이디 <span className="font-medium text-ink">{maskedLoginId}</span>가 있어요.
              <br />
              아이디·비밀번호로 한 번 로그인하면 {label} 계정이 연결되고, 다음부턴 {label}로 바로 들어와요.
            </>
          ) : (
            <>
              이 {label} 계정{maskedEmail ? <>(<span className="font-medium text-ink">{maskedEmail}</span>)</> : null}으로 가입한 회원이 없어요.
              <br />
              비밀번호 없이 {label} 계정으로 바로 가입할 수 있어요.
              <br />
              이미 다른 이메일로 가입했다면 아이디·비밀번호로 로그인하면 연결돼요.
            </>
          )}
        </DialogDescription>

        <DialogFooter className="flex flex-col gap-[8px] sm:flex-col sm:space-x-0">
          {emailMatched ? (
            <Button
              type="button"
              onClick={onAccept}
              className="h-[48px] w-full rounded-[4px] bg-inverse text-[16px] text-inverse-fg hover:bg-inverse-2"
            >
              로그인해서 연결하기
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={onSignup}
                className="h-[48px] w-full rounded-[4px] bg-inverse text-[16px] text-inverse-fg hover:bg-inverse-2"
              >
                회원가입하기
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onAccept}
                className="h-[48px] w-full rounded-[4px] border-line-strong text-[16px] text-ink"
              >
                이미 회원이에요, 로그인할게요
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={onDecline}
            className="h-[40px] w-full text-[14px] text-ink-3 transition-colors hover:text-ink-2"
          >
            연결하지 않을게요
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
