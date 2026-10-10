'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { toast } from '@/lib/toast';

import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { createEvent, deleteEvent, deleteEventImage, updateEvent, uploadEventImages } from '@/apis/admin/event';
import { getErrorMessage } from '@/apis/auth';
import { getEvent, getEventCategories } from '@/apis/event';
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
 * (신규 eventId · updatedAt 뿐) 재조회가 필요하므로, refreshSignal을 올려 그쪽 조회를 다시 부른다.
 */
export default function AdminCalendarSection() {
  // 상세 자리에 무엇을 그릴지. null이면 읽기용 상세.
  // { mode: 'create', date } | { mode: 'edit', schedule }
  // create의 date는 폼의 시작 · 종료일 초깃값('yyyy-MM-dd'). 없으면 오늘.
  const [formTarget, setFormTarget] = React.useState(null);
  const [deletingSchedule, setDeletingSchedule] = React.useState(null);
  // 재조회 신호. key가 바뀌면 CalendarSection이 목록을 다시 부른다.
  const [refreshSignal, setRefreshSignal] = React.useState({ key: 0, date: null });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // '일정 구분' 선택지. 폼이 열릴 때마다 조회하지 않도록 여기서 한 번만 받아 내려준다.
  // 응답이 { message, data } 가 아니라 맨 배열이므로 언래핑하지 않는다. (apis/event.js 5번)
  // 순서는 서버의 display_order 를 그대로 쓴다 — 다시 정렬하면 시안 순서가 깨진다.
  const [categories, setCategories] = React.useState([]);
  const [hasCategoryError, setHasCategoryError] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    getEventCategories()
      .then((rows) => {
        if (isMounted) setCategories(rows.map((row) => row.name));
      })
      .catch((error) => {
        // 목록을 못 받으면 폼의 구분 셀렉트가 잠긴다. 하드코딩 fallback 은 두지 않는다.
        // 토스트는 폼을 열기 전에 사라지므로, 잠긴 이유를 셀렉트에도 적게 실패를 따로 넘긴다.
        console.error('일정 카테고리 목록 조회 실패:', error);
        if (!isMounted) return;

        setHasCategoryError(true);
        toast.error(getErrorMessage(error, '일정 구분 목록을 불러오지 못했습니다.'));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const closeForm = React.useCallback(() => setFormTarget(null), []);

  // 회원 달력의 ⋮ 메뉴('관리자 화면에서 수정/삭제')로 들어온 경우 — ?scheduleId=&date=&action=delete.
  // 그 달로 옮기고, 일정을 받아 수정 폼(또는 삭제 확인)을 바로 연다. 주소에서 지워 새로고침 때 다시 열리지 않게 한다 (10/10).
  // useSearchParams 는 정적 페이지에서 Suspense 경계를 요구하므로 마운트 뒤 window 에서 읽는다
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const scheduleId = url.searchParams.get('scheduleId');
    const date = url.searchParams.get('date');
    const action = url.searchParams.get('action');
    // ?action=create[&date=] — 회원 달력의 '일정 등록' 링크. 그 날짜(없으면 오늘)로 추가 폼을 연다
    if (!scheduleId && action === 'create') {
      url.searchParams.delete('date');
      url.searchParams.delete('action');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
      if (date) setRefreshSignal((prev) => ({ key: prev.key + 1, date }));
      setFormTarget({ mode: 'create', date: date ?? null });
      return;
    }
    if (!scheduleId) return;
    url.searchParams.delete('scheduleId');
    url.searchParams.delete('date');
    url.searchParams.delete('action');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);

    if (date) setRefreshSignal((prev) => ({ key: prev.key + 1, date }));
    getEvent(scheduleId)
      .then((schedule) => {
        if (!schedule) return;
        if (action === 'delete') setDeletingSchedule(schedule);
        else setFormTarget({ mode: 'edit', schedule });
      })
      .catch((error) => toast.error(getErrorMessage(error, '일정을 불러오지 못했습니다.')));
  }, []);

  // 달력에서 단일 클릭으로 고른 날짜('yyyy-MM-dd'). '일정 추가' 버튼의 초깃값으로 쓴다 — 날짜를 누르고 버튼을
  // 눌렀는데 오늘만 들어간다는 테스터 제보(2026-10-05). 선택을 풀면 null → ScheduleForm 이 오늘로 채운다.
  const [selectedDate, setSelectedDate] = React.useState(null);
  const handleUserSelect = React.useCallback((date) => {
    setFormTarget(null);
    setSelectedDate(date ? format(date, 'yyyy-MM-dd') : null);
  }, []);

  // focusDate('yyyy-MM-dd')를 주면 달력을 그 달로 옮겨서 조회한다. 다른 달에 저장한 일정은
  // 지금 보고 있는 달을 다시 불러 봐야 나오지 않아, 성공했는데도 실패로 읽히기 때문이다.
  // 삭제는 옮길 곳이 없으므로 인자 없이 부른다.
  const refresh = React.useCallback((focusDate = null) => {
    setRefreshSignal((prev) => ({ key: prev.key + 1, date: focusDate }));
  }, []);

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
        // 반복 등록 — 폼이 계산해 준 시작일들(repeatDates)마다 같은 내용의 일정을 하나씩 만든다 (PM 요청, 10/10).
        // 반복 규칙을 서버에 저장하지 않고 개별 일정으로 두므로 하나씩 고치거나 지울 수 있다.
        // 알림은 첫 일정 한 번만 보낸다 — 12주짜리 반복에 12번 푸시가 가면 안 된다.
        const repeatDates = !isEdit && values.repeatDates?.length > 1 ? values.repeatDates : null;
        if (repeatDates) {
          const spanDays = differenceInCalendarDays(parseISO(values.endDate), parseISO(values.startDate));
          const newImages = values.newImages ?? [];
          let created = 0;
          let imageFailed = false;
          for (const startDate of repeatDates) {
            const endDate = format(addDays(parseISO(startDate), spanDays), 'yyyy-MM-dd');
            // eslint-disable-next-line no-await-in-loop
            const one = await createEvent({ ...values, startDate, endDate, notify: values.notify && created === 0 });
            created += 1;
            const eventId = one?.data?.eventId;
            if (eventId && newImages.length) {
              try {
                // eslint-disable-next-line no-await-in-loop
                await uploadEventImages(eventId, newImages);
              } catch {
                imageFailed = true;
              }
            }
          }
          toast.success(`일정 ${created}건을 반복 등록했습니다.`, {
            description: imageFailed
              ? '일부 일정의 이미지는 올리지 못했습니다. 해당 일정을 수정해 다시 붙여 주세요.'
              : '구글 캘린더를 구독 중인 회원에게는 최대 10분 안에 반영돼요.',
          });
          setFormTarget(null);
          refresh(repeatDates[0]);
          return;
        }

        const result = isEdit
          ? await updateEvent(values.scheduleId, values)
          : await createEvent(values);

        // 이미지는 일정이 저장된 뒤에 — 등록은 여기서야 eventId 가 생긴다.
        // 실패해도 일정 자체는 저장됐으니 알리기만 하고 화면은 정상 흐름대로 닫는다
        const eventId = isEdit ? values.scheduleId : result?.data?.eventId;
        const deleteIds = values.deleteImageIds ?? [];
        const newImages = values.newImages ?? [];
        if (eventId && (deleteIds.length || newImages.length)) {
          try {
            for (const imageId of deleteIds) {
              // eslint-disable-next-line no-await-in-loop
              await deleteEventImage(eventId, imageId);
            }
            if (newImages.length) await uploadEventImages(eventId, newImages);
          } catch (imageError) {
            toast.error(getErrorMessage(imageError, '일정은 저장됐지만 이미지 처리에 실패했습니다.'));
          }
        }

        toast.success(
          result?.message ?? (isEdit ? '일정이 수정되었습니다.' : '새로운 일정이 등록되었습니다.'),
          {
            // 구글 캘린더 팬아웃은 비동기라(실패 시 10분 간격 재시도) 회원 캘린더에 바로 보이지 않는다
            description: '구글 캘린더를 구독 중인 회원에게는 최대 10분 안에 반영돼요.',
          }
        );
        setFormTarget(null);
        refresh(values.startDate);
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
      onClick={() => setFormTarget({ mode: 'create', date: selectedDate })}
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
            categoriesError={hasCategoryError}
            onCancel={closeForm}
            onSubmit={handleSubmit}
            isSubmitting={isSaving}
          />
        );
      }

      return <ScheduleDetail schedule={selectedSchedule} fullWidth />;
    },
    [formTarget, closeForm, handleSubmit, isSaving, categories, hasCategoryError]
  );

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col bg-white px-4 py-4 sm:px-6 sm:py-7 md:p-10">
      <CalendarSection
        showSubscribe={false}
        refreshKey={refreshSignal.key}
        focusDate={refreshSignal.date}
        scheduleListAction={scheduleListAction}
        onDateDoubleClick={handleDateDoubleClick}
        // 달력 날짜나 목록 카드를 누르면 열려 있던 폼을 닫고 그 일정 상세로 돌아간다. 고른 날짜는 '일정 추가'가 쓴다
        onUserSelect={handleUserSelect}
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
