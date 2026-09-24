'use client';

import { Fragment } from 'react';

import { REPORT_TABS, getReportPanelId, getReportTabId } from '@/constants/adminReports';

/**
 * 신고 관리 - 게시글 신고 / 댓글 신고 탭
 *
 * 두 탭의 표 구조가 같아서 화면(라우트)을 나누지 않고 목록만 갈아끼운다.
 * 시안 글꼴은 42dot Sans지만 프로젝트에 없어서, 크기가 같은 기본 글꼴(다른 관리자 페이지의
 * '목록' 라벨과 동일한 18px)로 맞췄다.
 *
 * ARIA 탭 규칙을 따른다.
 *  - tablist의 자식은 tab만 둔다. 사이에 일반 div가 끼면 '탭 2개 중 1번째'로 읽히지 않는다.
 *    (구분선 span은 aria-hidden이라 접근성 트리에서 빠지므로 괜찮다)
 *  - 선택된 탭만 Tab 키 순서에 넣고(roving tabindex), 좌우 방향키로 탭을 옮긴다.
 *  - aria-controls로 목록(tabpanel)과 이어 준다.
 */
export default function ReportTabs({ value, onChange }) {
  const currentIndex = REPORT_TABS.findIndex((tab) => tab.value === value);

  const moveTo = (index) => {
    const next = REPORT_TABS[index];
    if (!next) return;

    onChange?.(next.value);
    // roving tabindex를 쓰므로 선택과 함께 포커스도 옮겨야 방향키로 계속 이동할 수 있다
    document.getElementById(getReportTabId(next.value))?.focus();
  };

  const handleKeyDown = (event) => {
    const lastIndex = REPORT_TABS.length - 1;

    const nextIndex = {
      ArrowRight: currentIndex >= lastIndex ? 0 : currentIndex + 1,
      ArrowLeft: currentIndex <= 0 ? lastIndex : currentIndex - 1,
      Home: 0,
      End: lastIndex,
    }[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();
    moveTo(nextIndex);
  };

  return (
    // 아래 진한 선은 탭 묶음 전체에 두른다 (시안: 표 위 구분선)
    <div
      role="tablist"
      aria-label="신고 대상 종류"
      onKeyDown={handleKeyDown}
      className="flex items-center border-b border-[#212121]"
    >
      {REPORT_TABS.map((tab, index) => {
        const selected = tab.value === value;

        return (
          <Fragment key={tab.value}>
            {/* 탭 사이 세로 구분선 */}
            {index > 0 && <span aria-hidden className="h-[19px] w-px bg-[#b9b9b9]" />}
            <button
              type="button"
              role="tab"
              id={getReportTabId(tab.value)}
              aria-selected={selected}
              aria-controls={getReportPanelId(tab.value)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange?.(tab.value)}
              className={`px-[10px] py-[8px] text-[18px] leading-[1.6] tracking-[-0.36px] transition-colors ${
                selected ? 'font-bold text-[#212121]' : 'text-[#b9b9b9] hover:text-[#919191]'
              }`}
            >
              {tab.label}
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
