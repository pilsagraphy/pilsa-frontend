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
export default function GoogleLinkDialog({ open, pending, onAccept, onSignup, onDecline }) {
  if (!pending) return null;
  const { emailMatched, maskedEmail, maskedLoginId } = pending;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDecline?.()}>
      <DialogContent
        hideCloseButton
        className="max-w-[380px] gap-[20px] rounded-[4px] border-[#dedede] p-[24px]"
      >
        <DialogTitle className="text-center text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-[#212121]">
          {emailMatched ? '이미 가입된 계정이에요' : '가입된 회원을 찾지 못했어요'}
        </DialogTitle>

        <DialogDescription className="text-center text-[14px] leading-[1.7] tracking-[-0.28px] text-[#454545] [word-break:keep-all]">
          {emailMatched ? (
            <>
              구글 계정 <span className="font-medium text-[#212121]">{maskedEmail}</span>과 같은 이메일로
              가입된 회원(아이디 <span className="font-medium text-[#212121]">{maskedLoginId}</span>)이 있어요.
              <br />
              이 구글 계정을 그 회원 계정에 연결할까요?
              <br />
              본인 확인을 위해 아이디·비밀번호로 한 번만 로그인하면 연결되고, 다음부터는 구글로 바로
              로그인할 수 있어요.
            </>
          ) : (
            <>
              구글 계정 <span className="font-medium text-[#212121]">{maskedEmail}</span>로 가입된 회원이
              없어요.
              <br />
              회원가입을 진행할까요? 가입을 마치고 로그인하면 이 구글 계정이 자동으로 연결돼요.
              <br />
              다른 이메일로 이미 가입했다면 아이디·비밀번호로 로그인해도 연결돼요.
            </>
          )}
        </DialogDescription>

        <DialogFooter className="flex flex-col gap-[8px] sm:flex-col sm:space-x-0">
          {emailMatched ? (
            <Button
              type="button"
              onClick={onAccept}
              className="h-[48px] w-full rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242]"
            >
              로그인해서 연결하기
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={onSignup}
                className="h-[48px] w-full rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242]"
              >
                회원가입하기
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onAccept}
                className="h-[48px] w-full rounded-[4px] border-[#b9b9b9] text-[16px] text-[#212121]"
              >
                이미 회원이에요, 로그인할게요
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={onDecline}
            className="h-[40px] w-full text-[14px] text-[#919191] transition-colors hover:text-[#454545]"
          >
            연결하지 않을게요
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
