import React from 'react';

// 게시글 · 댓글의 상태(공개 · 블라인드 · 삭제) 표시. 관리자 상세에서만 쓴다 (사용자 화면에는 상태를 보여주지 않는다).
//
// '상태: 공개'처럼 이름을 붙인다 — 글자만 두면 '테스트재학생 삭제'처럼 작성자 이름의 일부로 읽힌다.
// 모양은 다른 배지(카테고리·재학생·권한)와 같은 둥근 알약이다. 채우지 않고 테두리만 써서 카테고리(검정 채우기)와 갈린다.
export default function StateChip({ label }) {
  if (!label) return null;

  return (
    <span className="shrink-0 whitespace-nowrap rounded-full border border-[#B9B9B9] px-[9px] py-[1px] text-[12px] leading-[1.6] tracking-[-0.24px] text-[#454545]">
      <span className="text-[#919191]">상태: </span>
      {label}
    </span>
  );
}
