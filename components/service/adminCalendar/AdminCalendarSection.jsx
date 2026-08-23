'use client';

import * as React from 'react';

import CalendarSection from '@/components/shared/calendars/CalendarSection';
import ScheduleDetail from '@/components/shared/calendars/ScheduleDetail';

import ScheduleActionMenu from './ScheduleActionMenu';
import ScheduleDeleteModal from './ScheduleDeleteModal';
import ScheduleForm from './ScheduleForm';

/**
 * 관리자 일정 달력.
 *
 * 달력 · 월별 일정 · 일정 상세는 일반 회원 화면(CalendarSection)을 그대로 쓰고,
 * 관리자 화면에만 필요한 두 가지를 끼워 넣는다.
 *  - 월별 일정 카드 오른쪽의 ⋮ 메뉴 (일정 수정 · 일정 삭제)
 *  - '일정 수정'을 고르면 상세 자리에 뜨는 수정 폼
 */
export default function AdminCalendarSection({ response }) {
  const [editingSchedule, setEditingSchedule] = React.useState(null);
  const [deletingSchedule, setDeletingSchedule] = React.useState(null);

  const renderScheduleAction = React.useCallback(
    (schedule, isSelected) => (
      <ScheduleActionMenu
        isSelected={isSelected}
        onEdit={() => setEditingSchedule(schedule)}
        onDelete={() => setDeletingSchedule(schedule)}
      />
    ),
    []
  );

  const renderDetail = React.useCallback(
    (selectedSchedule) => {
      if (editingSchedule) {
        return (
          <ScheduleForm
            // 다른 일정의 수정을 이어서 열면 입력값이 남지 않도록 초기화한다.
            key={editingSchedule.scheduleId}
            schedule={editingSchedule}
            onCancel={() => setEditingSchedule(null)}
            // TODO: API 연동 시 수정 요청을 보내고 목록을 다시 불러올 것.
            onSubmit={() => setEditingSchedule(null)}
          />
        );
      }

      return <ScheduleDetail schedule={selectedSchedule} fullWidth />;
    },
    [editingSchedule]
  );

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col bg-white px-4 py-4 sm:px-6 sm:py-7 md:p-10">
      <CalendarSection
        response={response}
        renderScheduleAction={renderScheduleAction}
        renderDetail={renderDetail}
        // 관리자 화면은 목록 안에서 스크롤하지 않고 페이지 전체가 늘어나게 둔다.
        scrollableScheduleList={false}
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
