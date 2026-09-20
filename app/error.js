'use client';

import { useEffect } from 'react';

// 화면이 그리다 죽었을 때 Next 기본 문구("Application error…") 대신 뜨는 화면.
//
// 기본 문구는 콘솔을 열어 보라고만 해서, 폰으로 보는 회원은 무슨 일인지 알 길이 없고
// 운영진도 "게시판이 죽었다" 이상은 전달받지 못한다. 오류 메시지를 화면에 같이 적어 두면
// 캡처 한 장으로 원인 파악이 시작된다. 스택은 콘솔로만 보낸다 — 회원에게 보여 줄 정보가 아니다.
export default function RouteError({ error, reset }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  const message = String(error?.message ?? error ?? '알 수 없는 오류');

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="text-[18px] font-semibold tracking-[-0.02em] text-[#212121]">
        화면을 불러오지 못했어요
      </p>
      <p className="text-[14px] leading-[1.6] tracking-[-0.02em] text-[#757575]">
        다시 시도해도 같다면 아래 문구를 캡처해 운영진에게 보내주세요.
      </p>
      <code className="w-full whitespace-pre-wrap break-all rounded-[8px] bg-[#F5F5F5] px-4 py-3 text-left text-[12px] leading-[1.6] text-[#454545]">
        {message}
        {error?.digest ? `\n(digest ${error.digest})` : ''}
      </code>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="h-[44px] rounded-[4px] bg-[#212121] px-5 text-[15px] text-white transition-colors hover:bg-black"
        >
          다시 시도
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/';
          }}
          className="h-[44px] rounded-[4px] border border-[#b9b9b9] bg-white px-5 text-[15px] text-[#212121] transition-colors hover:bg-[#f5f5f5]"
        >
          처음으로
        </button>
      </div>
    </div>
  );
}
