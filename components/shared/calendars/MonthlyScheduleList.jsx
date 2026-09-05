'use client';

import MonthlyScheduleItem from '@/components/shared/calendars/MonthlyScheduleItem';

// 목록이 길어지면 오른쪽에 얇은 스크롤바가 생긴다. (디자인의 회색 막대)
const SCROLLBAR_CLASS = [
  '[&::-webkit-scrollbar]:w-[4px]',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:bg-[#dedede]',
].join(' ');

// 카드 사이 간격. 아래 visibleCount 높이 계산에 그대로 쓰이므로 클래스와 값을 맞춰 둔다.
const ITEM_GAP = 12;

// hasError: 조회 실패. 빈 목록('일정 없음')과 구분해서 실패 문구를 그린다.
// scrollable: 목록이 길어지면 목록 안에서 스크롤한다. (일반 회원 화면의 기본 동작)
//             false면 목록이 그대로 늘어나 페이지 전체가 길어진다.
// visibleCount: 한 번에 보일 카드 수. 그 이상은 스크롤로 본다. (관리자 화면 — 5개)
//               카드 높이가 반응형이라 --item-h로 받아 calc으로 높이를 잡는다.
export default function MonthlyScheduleList({
  schedules = [],
  selectedId = null,
  onSelect,
  isLoading = false,
  hasError = false,
  renderAction,
  scrollable = true,
  visibleCount = null,
}) {
  if (isLoading) {
    return (
      <div className="text-[14px] tracking-[-0.32px] text-[#919191] md:text-[16px]">
        일정을 불러오는 중입니다.
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-[14px] tracking-[-0.32px] text-[#919191] md:text-[16px]">
        일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-[14px] tracking-[-0.32px] text-[#919191] md:text-[16px]">
        아직 일정이 존재하지 않아요.
      </div>
    );
  }

  // 보일 개수가 지정되면 그 높이에 딱 맞춰 자르고, 아니면 기존 뷰포트 기준 상한을 쓴다.
  const isCapped = scrollable && visibleCount > 0;

  // 스크롤바 자리(4px)를 늘 비워 둔다. 목록이 짧아 스크롤바가 없을 때도 카드 오른쪽 끝이
  // 그대로라서, 위 라벨 줄에 놓이는 버튼과 항상 같은 선에 맞는다.
  const scrollClass = scrollable
    ? `overflow-y-auto pr-[6px] [scrollbar-gutter:stable] ${SCROLLBAR_CLASS} ${
        isCapped
          ? // 카드 높이: 모바일 62px · md 이상 70px (MonthlyScheduleItem과 같은 값)
            '[--item-h:62px] md:[--item-h:70px]'
          : 'max-h-[min(45vh,262px)] sm:max-h-[min(52vh,344px)] lg:max-h-[450px]'
      }`
    : '';

  const scrollStyle = isCapped
    ? {
        maxHeight: `calc(${visibleCount} * var(--item-h) + ${(visibleCount - 1) * ITEM_GAP}px)`,
      }
    : undefined;

  return (
    <div className={`w-full ${scrollClass}`} style={scrollStyle}>
      <div className="flex flex-col" style={{ gap: `${ITEM_GAP}px` }}>
        {schedules.map((schedule) => (
          <MonthlyScheduleItem
            key={schedule.scheduleId}
            schedule={schedule}
            isSelected={selectedId === schedule.scheduleId}
            onClick={onSelect}
            renderAction={renderAction}
          />
        ))}
      </div>
    </div>
  );
}
