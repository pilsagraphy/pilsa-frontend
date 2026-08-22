'use client';
import React, { useEffect, useRef } from 'react';

// 현재 상태에 따른 정지/주의 뱃지 (항상 불투명)
// - 정지: 빨간 테두리 + 흰 배경 + 빨간 글자
// - 주의: 테두리 없이 회색 배경 + 흰 글자
function StatusBadge({ status }) {
  if (status === '주의') {
    return (
      <span className="shrink-0 rounded-[11px] bg-[#919191] px-[9px] text-[14px] leading-[1.6] tracking-[-0.28px] text-white">
        주의
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-[11px] border border-[#ae0000] bg-white px-[9px] text-[14px] leading-[1.6] tracking-[-0.28px] text-[#ae0000]">
      {status || '정지'}
    </span>
  );
}

// 회원목록의 개별 회원 컴포넌트
export default function MemberList({ member, selected = false, dimmed = false, onClick }) {
  const scrollRef = useRef(null);
  const rafRef = useRef(null);
  const holdTimerRef = useRef(null);

  const cancelAuto = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    clearTimeout(holdTimerRef.current);
    rafRef.current = null;
  };

  const resetScroll = () => {
    cancelAuto();
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  };

  // 회원정보 텍스트 자동 스크롤: 끝까지 이동 → 2초 유지 → 다시 왼쪽 정렬(첫 글자)
  const startAutoScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return; // 넘칠 내용이 없으면 스크롤 불필요

    cancelAuto();
    el.scrollLeft = 0;

    const duration = Math.max(1600, max * 24); // 길이에 비례한 이동 시간(기존의 1/2 속도)
    let startTs = null;
    const step = (ts) => {
      if (startTs === null) startTs = ts;
      const t = Math.min(1, (ts - startTs) / duration);
      el.scrollLeft = max * t;
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        // 끝까지 스크롤 후 2초 유지 → 다시 첫 글자로 복귀
        holdTimerRef.current = setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollLeft = 0;
        }, 2000);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  // 언마운트 시 진행 중인 애니메이션/타이머 정리
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(holdTimerRef.current);
    },
    [],
  );

  // 선택 해제되면 자동 스크롤 중단 + 초기화
  useEffect(() => {
    if (!selected) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(holdTimerRef.current);
      rafRef.current = null;
      if (scrollRef.current) scrollRef.current.scrollLeft = 0;
    }
  }, [selected]);

  const handleClick = () => {
    if (selected) {
      // 이미 선택된 회원을 다시 클릭 → 자동 스크롤
      startAutoScroll();
    } else {
      // 선택되지 않은 회원 클릭 → 선택 기능만 발생
      onClick?.(member);
    }
  };

  const handleMouseEnter = () => {
    if (selected) startAutoScroll(); // 선택된 회원에 마우스 오버 → 자동 스크롤
  };

  const handleMouseLeave = () => {
    resetScroll(); // 마우스를 떼면 즉시 중단 + 첫 글자로 복귀
  };

  const label = `${member.name} (${member.loginId}, ${member.nickname})`;
  const textColor = selected ? 'text-[#212121]' : dimmed ? 'text-[#b9b9b9]' : 'text-[#454545]';

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative h-[45px] w-full cursor-pointer border-b border-[#b9b9b9] font-['Pretendard',sans-serif] ${
        selected ? 'border-l-2 border-l-[#212121] bg-[#f6f6f6]' : ''
      }`}
    >
      {/* 회원 정보 텍스트 (왼쪽 정렬). 스크롤바 없이 자동 스크롤만 (overflow-hidden).
          우측 패딩(74px)이 배지 흰 배경 폭(약 64px)보다 커서, 끝까지 스크롤하면
          ')'가 배지 배경보다 왼쪽에서 멈춰 회원정보가 모두 보인다. */}
      <div
        ref={scrollRef}
        className="absolute inset-y-0 left-0 right-0 overflow-hidden whitespace-nowrap pl-[6px] pr-[74px]"
      >
        <span className={`text-[16px] leading-[45px] tracking-[-0.32px] ${textColor}`}>{label}</span>
      </div>

      {/* 정지 / 주의 뱃지: 우측 고정 + 뒤에 흰 배경으로 글자를 가림 (항상 불투명, 위치 고정) */}
      <div className="absolute inset-y-0 right-0 flex items-center bg-white pl-[10px] pr-[6px]">
        <StatusBadge status={member.currentStatus} />
      </div>
    </div>
  );
}
