'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

import CalendarSection from '@/components/shared/calendars/CalendarSection';
import ScheduleDetail from '@/components/shared/calendars/ScheduleDetail';

import ScheduleActionMenu from './ScheduleActionMenu';
import ScheduleDeleteModal from './ScheduleDeleteModal';
import ScheduleForm from './ScheduleForm';

/**
 * 관리자 일정 달력.
 *
 * 달력 · 월별 일정 · 일정 상세는 일반 회원 화면(CalendarSection)을 그대로 쓰고,
 * 관리자 화면에만 필요한 것들을 끼워 넣는다.
 *  - '월별 일정' 라벨 오른쪽의 일정 추가 버튼 (달력 날짜 더블클릭도 같은 폼을 연다)
 *  - 월별 일정 카드 오른쪽의 ⋮ 메뉴 (일정 수정 · 일정 삭제)
 *  - 추가 · 수정을 고르면 상세 자리에 뜨는 폼
 */
export default function AdminCalendarSection({ response }) {
  // 상세 자리에 무엇을 그릴지. null이면 읽기용 상세.
  // { mode: 'create', date } | { mode: 'edit', schedule }
  // create의 date는 폼의 시작 · 종료일 초깃값('yyyy-MM-dd'). 없으면 오늘.
  const [formTarget, setFormTarget] = React.useState(null);
  const [deletingSchedule, setDeletingSchedule] = React.useState(null);

  const closeForm = React.useCallback(() => setFormTarget(null), []);

  // 달력 날짜를 더블클릭하면 그 날짜로 일정 추가 폼을 연다.
  const handleDateDoubleClick = React.useCallback((date) => {
    setFormTarget({ mode: 'create', date: format(date, 'yyyy-MM-dd') });
  }, []);

  const renderScheduleAction = React.useCallback(
    (schedule, isSelected) => (
      <ScheduleActionMenu
        isSelected={isSelected}
        onEdit={() => setFormTarget({ mode: 'edit', schedule })}
        onDelete={() => setDeletingSchedule(schedule)}
      />
    ),
    []
  );

  const scheduleListAction = (
    <button
      type="button"
      onClick={() => setFormTarget({ mode: 'create' })}
      className="flex h-[28px] shrink-0 items-center gap-[4px] rounded-[4px] border border-[#454545] bg-white pe-[10px] ps-[8px] text-[12px] leading-[1.6] tracking-[-0.24px] text-[#454545] transition-colors hover:bg-[#f6f6f6]"
    >
      <Plus aria-hidden="true" strokeWidth={1.8} className="size-[12px]" />
      일정 추가
    </button>
  );

  const renderDetail = React.useCallback(
    (selectedSchedule) => {
      if (formTarget) {
        return (
          <ScheduleForm
            // 다른 일정의 폼을 이어서 열면 입력값이 남지 않도록 초기화한다.
            key={
              formTarget.mode === 'edit'
                ? `edit-${formTarget.schedule.scheduleId}`
                : `create-${formTarget.date ?? 'today'}`
            }
            schedule={formTarget.mode === 'edit' ? formTarget.schedule : null}
            defaultDate={formTarget.mode === 'create' ? formTarget.date : null}
            onCancel={closeForm}
            // TODO: API 연동 시 등록 · 수정 요청을 보내고 목록을 다시 불러올 것.
            onSubmit={closeForm}
          />
        );
      }

      return <ScheduleDetail schedule={selectedSchedule} fullWidth />;
    },
    [formTarget, closeForm]
  );

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col bg-white px-4 py-4 sm:px-6 sm:py-7 md:p-10">
      <CalendarSection
        response={response}
        scheduleListAction={scheduleListAction}
        onDateDoubleClick={handleDateDoubleClick}
        // 달력 날짜나 목록 카드를 누르면 열려 있던 폼을 닫고 그 일정 상세로 돌아간다.
        onUserSelect={closeForm}
        renderScheduleAction={renderScheduleAction}
        renderDetail={renderDetail}
        // 월별 일정은 5개까지만 보이고 그 이상은 목록 안에서 스크롤한다.
        scheduleListVisibleCount={5}
      />

      <ScheduleDeleteModal
        schedule={deletingSchedule}
        // TODO: API 연동 시 삭제 요청을 보내고 목록을 다시 불러올 것.
        onConfirm={() => setDeletingSchedule(null)}
        onCancel={() => setDeletingSchedule(null)}
      />
    </div>
  );
}
