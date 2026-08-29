'use client';

import { parseISO } from 'date-fns';
import { Plus } from 'lucide-react';

// 목록에서는 날짜를 짧게 적는다.
// 하루: '10월 20일' / 같은 달: '10월 20~21일' / 달이 다르면: '10월 20일 ~ 11월 2일'
function formatDateRange(startDate, endDate) {
  if (!startDate) return '';

  const start = parseISO(startDate);
  if (Number.isNaN(start.getTime())) return startDate;

  const startText = `${start.getMonth() + 1}월 ${start.getDate()}일`;
  if (!endDate || endDate === startDate) return startText;

  const end = parseISO(endDate);
  if (Number.isNaN(end.getTime())) return startText;

  const isSameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();

  if (isSameMonth) {
    return `${start.getMonth() + 1}월 ${start.getDate()}~${end.getDate()}일`;
  }

  return `${startText} ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
}

// renderAction: 오른쪽 끝에 놓을 조작 버튼을 그리는 함수. (관리자 화면의 ⋮ 메뉴)
// 넘기지 않으면 일반 회원 화면처럼 장식용 + 아이콘이 그려진다.
export default function MonthlyScheduleItem({
  schedule,
  isSelected = false,
  onClick,
  renderAction,
}) {
  const action = renderAction?.(schedule, isSelected);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => onClick?.(schedule)}
        aria-expanded={isSelected}
        className={[
          'flex h-[62px] w-full items-center justify-between gap-4 rounded-[5px] px-[16px] text-left transition md:h-[70px] md:px-[20px]',
          isSelected ? 'bg-[#454545]' : 'bg-[#f6f6f6] hover:bg-[#ededed]',
        ].join(' ')}
      >
        <span className="flex min-w-0 flex-col gap-[2px]">
          <span
            className={[
              'truncate text-[14px] leading-[1.6] tracking-[-0.28px]',
              isSelected ? 'text-white' : 'text-[#212121]',
            ].join(' ')}
          >
            {schedule.title}
          </span>
          <span className="truncate text-[12px] leading-[1.6] tracking-[-0.24px] text-[#919191]">
            {formatDateRange(schedule.startDate, schedule.endDate)}
          </span>
        </span>

        {/* 조작 버튼은 버튼 안에 버튼을 넣을 수 없어 카드 위에 겹쳐 그린다.
            그 경우 여기서는 자리만 비워 둔다. */}
        {action ? (
          <span aria-hidden="true" className="size-6 shrink-0" />
        ) : (
          // 아래에 상세를 펼친다는 표시 (버튼 전체가 클릭 영역이라 아이콘은 장식)
          <Plus
            aria-hidden="true"
            strokeWidth={1.4}
            className={['size-6 shrink-0', isSelected ? 'text-white' : 'text-[#919191]'].join(' ')}
          />
        )}
      </button>

      {/* translate로 가운데를 맞추면 transform이 걸린 조상이 되어
          조작 버튼 안에서 띄우는 fixed 메뉴의 기준점이 뷰포트가 아니게 된다.
          그래서 flex로만 세로 가운데 정렬한다. */}
      {action && (
        <div className="absolute inset-y-0 right-[16px] flex items-center md:right-[20px]">
          {action}
        </div>
      )}
    </div>
  );
}
