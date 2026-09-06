import React from 'react';

// 게시글 · 댓글의 상태(공개 · 블라인드 · 삭제)를 네모 테두리로 감싼 표시.
// 관리자 상세에서만 쓴다 (사용자 화면에는 상태를 보여주지 않는다).
//
// 테두리로 감싸는 이유는 제목·작성자 이름 바로 옆에 붙기 때문이다.
// 글자만 두면 '테스트재학생 삭제'처럼 이름의 일부로 읽힌다.
// 카테고리 배지(검정 채우기)와도 구분돼야 해서 채우지 않고 테두리만 쓴다.
export default function StateChip({ label }) {
  if (!label) return null;

  return (
    <span className="shrink-0 rounded-[3px] border border-[#212121] px-[8px] py-[1px] text-[12px] leading-[1.6] tracking-[-0.24px] text-[#212121]">
      {label}
    </span>
  );
}
