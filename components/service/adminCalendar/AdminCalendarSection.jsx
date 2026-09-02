'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { createEvent, deleteEvent, updateEvent } from '@/apis/admin/event';
import { getErrorMessage } from '@/apis/auth';
import { getEventCategories } from '@/apis/event';
import CalendarSection from '@/components/shared/calendars/CalendarSection';
import ScheduleDetail from '@/components/shared/calendars/ScheduleDetail';

import ScheduleActionMenu from './ScheduleActionMenu';
import ScheduleDeleteModal from './ScheduleDeleteModal';
import ScheduleForm from './ScheduleForm';

// 404 = 없거나 이미 삭제된 일정. 다른 관리자가 먼저 지운 경우라 목록에 남은 카드가 유령이므로,
// 요청은 실패했어도 목록을 다시 불러 그 카드를 치운다.
const isAlreadyGone = (error) => error?.response?.status === 404;

/**
 * 관리자 일정 달력.
 *
 * 달력 · 월별 일정 · 일정 상세는 일반 회원 화면(CalendarSection)을 그대로 쓰고,
 * 관리자 화면에만 필요한 것들을 끼워 넣는다.
 *  - '월별 일정' 라벨 오른쪽의 일정 추가 버튼 (달력 날짜 더블클릭도 같은 폼을 연다)
 *  - 월별 일정 카드 오른쪽의 ⋮ 메뉴 (일정 수정 · 일정 삭제)
 *  - 추가 · 수정을 고르면 상세 자리에 뜨는 폼
 *
 * 목록 조회는 CalendarSection이 자기 안에서 한다. 등록 · 수정 · 삭제 응답에는 목록이 없어
 * (신규 eventId · updatedAt 뿐) 재조회가 필요하므로, refreshKey를 올려 그쪽 조회를 다시 부른다.
 */
export default function AdminCalendarSection({ response }) {
  // 상세 자리에 무엇을 그릴지. null이면 읽기용 상세.
  // { mode: 'create', date } | { mode: 'edit', schedule }
  // create의 date는 폼의 시작 · 종료일 초깃값('yyyy-MM-dd'). 없으면 오늘.
  const [formTarget, setFormTarget] = React.useState(null);
  const [deletingSchedule, setDeletingSchedule] = React.useState(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // '일정 구분' 선택지. 폼이 열릴 때마다 조회하지 않도록 여기서 한 번만 받아 내려준다.
  // 응답이 { message, data } 가 아니라 맨 배열이므로 언래핑하지 않는다. (apis/event.js 5번)
  // 순서는 서버의 display_order 를 그대로 쓴다 — 다시 정렬하면 시안 순서가 깨진다.
  const [categories, setCategories] = React.useState([]);

  React.useEffect(() => {
    let isMounted = true;

    getEventCategories()
      .then((rows) => {
        if (isMounted) setCategories(rows.map((row) => row.name));
      })
      .catch((error) => {
        // 목록을 못 받으면 폼의 구분 셀렉트가 잠긴다. 하드코딩 fallback 은 두지 않는다.
        console.error('일정 카테고리 목록 조회 실패:', error);
        if (isMounted) toast.error(getErrorMessage(error, '일정 구분 목록을 불러오지 못했습니다.'));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const closeForm = React.useCallback(() => setFormTarget(null), []);
  const refresh = React.useCallback(() => setRefreshKey((prev) => prev + 1), []);

  // 달력 날짜를 더블클릭하면 그 날짜로 일정 추가 폼을 연다.
  const handleDateDoubleClick = React.useCallback((date) => {
    setFormTarget({ mode: 'create', date: format(date, 'yyyy-MM-dd') });
  }, []);

  // 폼의 확인 — 추가면 등록, 수정이면 수정 요청을 보내고 목록을 다시 불러온다.
  // 날짜 앞뒤 검증은 ScheduleForm이 이미 하고 통과한 값만 올려 준다.
  // (수정 API에는 서버 검증이 없으므로 그 검증을 지우면 안 된다 — apis/admin/event.js 2번)
  const handleSubmit = React.useCallback(
    async (values) => {
      if (isSaving) return;

      const isEdit = formTarget?.mode === 'edit';
      setIsSaving(true);

      try {
        const result = isEdit
          ? await updateEvent(values.scheduleId, values)
          : await createEvent(values);

        toast.success(
          result?.message ?? (isEdit ? '일정이 수정되었습니다.' : '새로운 일정이 등록되었습니다.')
        );
        setFormTarget(null);
        refresh();
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            isEdit ? '일정을 수정하지 못했습니다.' : '일정을 등록하지 못했습니다.'
          )
        );

        if (isEdit && isAlreadyGone(error)) {
          setFormTarget(null);
          refresh();
        }
      } finally {
        setIsSaving(false);
      }
    },
    [formTarget, isSaving, refresh]
  );

  // 삭제 확인 — 메서드는 DELETE지만 서버는 소프트 삭제한다.
  const handleDelete = React.useCallback(async () => {
    if (!deletingSchedule || isDeleting) return;

    const { scheduleId } = deletingSchedule;
    setIsDeleting(true);

    try {
      const result = await deleteEvent(scheduleId);
      toast.success(result?.message ?? '일정이 정상적으로 삭제되었습니다.');
      setDeletingSchedule(null);

      // 지운 일정의 수정 폼이 열려 있으면 같이 닫는다. (없는 일정을 수정하게 두면 404가 난다)
      setFormTarget((prev) =>
        prev?.mode === 'edit' && prev.schedule.scheduleId === scheduleId ? null : prev
      );
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, '일정을 삭제하지 못했습니다.'));

      if (isAlreadyGone(error)) {
        setDeletingSchedule(null);
        refresh();
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deletingSchedule, isDeleting, refresh]);

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
            categories={categories}
            onCancel={closeForm}
            onSubmit={handleSubmit}
            isSubmitting={isSaving}
          />
        );
      }

      return <ScheduleDetail schedule={selectedSchedule} fullWidth />;
    },
    [formTarget, closeForm, handleSubmit, isSaving, categories]
  );

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col bg-white px-4 py-4 sm:px-6 sm:py-7 md:p-10">
      <CalendarSection
        response={response}
        refreshKey={refreshKey}
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
        onConfirm={handleDelete}
        onCancel={() => setDeletingSchedule(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
