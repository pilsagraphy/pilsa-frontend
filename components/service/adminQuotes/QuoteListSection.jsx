'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getErrorMessage } from '@/apis/auth';
import { createQuote, deleteQuote, getAdminQuotes, updateQuote } from '@/apis/admin/quotes';
import { Button } from '@/components/ui/button';
import SearchInput from '@/components/shared/board/boardList/SearchInput';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import PaginationWithEllipsis from '@/components/shared/PaginationWithEllipsis';
import ConfirmModal from '@/components/common/ConfirmModal';
import { CalendarDays } from 'lucide-react';
import ScheduleDatePicker from '@/components/service/adminCalendar/ScheduleDatePicker';

// 'YYYY-MM-DD'
const toInputDate = (value) => String(value ?? '').slice(0, 10);

// 달력(ScheduleDatePicker)은 { year, month, day } 로 주고받는다
const toDateParts = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (m) return { year: m[1], month: m[2], day: m[3] };
  const d = new Date();
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    day: String(d.getDate()).padStart(2, '0'),
  };
};
const partsToInput = ({ year, month, day }) => `${year}-${month}-${day}`;

const today = () => new Date().toISOString().slice(0, 10);

// 기본 노출 기간: 오늘부터 한 달. 짧게 잡아 두고 잊으면 메인에서 문장이 사라진다
const defaultEnd = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
};

// 새 문장 폼은 날짜를 미리 채워 둔다 — 비워 두면 매번 두 칸을 채워야 하고, 잊으면 문장이 안 뜬다
const freshForm = () => ({ quoteId: null, content: '', startDate: today(), endDate: defaultEnd() });

// 서버는 문장을 한 번에 다 준다(GET /api/admin/quotes 에 page 가 없다) — 화면에서 끊어 보여 준다
const PAGE_SIZE = 10;

/**
 * 이 주의 문장 관리.
 *
 * 메인·마이페이지 인사말 옆에 뜨는 문장이다. 서버는 오늘이 노출기간에 드는 문장 중 하나를 무작위로 돌려준다.
 * (기간이 지난 문장만 남으면 인사말 옆이 비워진다 — 그 상태를 화면에서 바로 알 수 있게 '노출 중' 을 표시한다)
 *
 * 검색은 화면에서 한다 — 서버가 목록을 통째로 주므로 다시 부를 것이 없다.
 * 문장에 든 글자로도, 어느 날짜에 노출되는지(그 날이 기간에 드는 문장)로도 찾는다.
 */
export default function QuoteListSection({ title = '이 주의 문장' }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(freshForm);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const [keyword, setKeyword] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // 삭제 확인 중인 문장
  // 날짜는 일정 등록과 같은 달력으로 고른다 (브라우저 기본 날짜 입력은 폰·PC 모양이 제각각이었다)
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeTriggerRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTriggerRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setQuotes(await getAdminQuotes());
    } catch (err) {
      setError(getErrorMessage(err, '문장 목록을 불러오지 못했습니다.'));
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isEdit = form.quoteId != null;

  const startEdit = (quote) => {
    setForm({
      quoteId: quote.quoteId,
      content: quote.content ?? '',
      startDate: toInputDate(quote.startDate),
      endDate: toInputDate(quote.endDate),
    });
    // 폼은 맨 위에 있다 — 아래쪽 문장을 고치려고 누르면 폼이 안 보이는 채로 바뀐다
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const content = form.content.trim();

    if (!content) {
      toast.error('문장을 입력해 주세요.');
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error('노출 기간을 입력해 주세요.');
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }

    setSaving(true);
    try {
      const body = { content, startDate: form.startDate, endDate: form.endDate };
      if (isEdit) await updateQuote(form.quoteId, body);
      else await createQuote(body);

      toast.success(isEdit ? '문장을 수정했습니다.' : '문장을 등록했습니다.');
      setForm(freshForm());
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '문장을 저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (quote) => setDeleteTarget(quote);

  const confirmDelete = async () => {
    const quote = deleteTarget;
    setDeleteTarget(null);
    if (!quote) return;

    try {
      await deleteQuote(quote.quoteId);
      toast.success('문장을 삭제했습니다.');
      if (form.quoteId === quote.quoteId) setForm(freshForm());
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '문장을 삭제하지 못했습니다.'));
    }
  };

  const now = today();
  const isLive = (q) => toInputDate(q.startDate) <= now && now <= toInputDate(q.endDate);
  const showingCount = quotes.filter(isLive).length;

  // 검색: 글자는 문장 안에서 찾고, 날짜는 그 날 노출되는 문장을 찾는다
  const filtered = useMemo(() => {
    const word = keyword.trim().toLowerCase();
    return quotes.filter((q) => {
      if (word && !String(q.content ?? '').toLowerCase().includes(word)) return false;
      if (searchDate) {
        if (!(toInputDate(q.startDate) <= searchDate && searchDate <= toInputDate(q.endDate)))
          return false;
      }
      return true;
    });
  }, [quotes, keyword, searchDate]);

  // 검색 조건이 바뀌면 첫 페이지로
  useEffect(() => {
    setPage(1);
  }, [keyword, searchDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageQuotes = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const isSearching = Boolean(keyword || searchDate);

  const inputClass =
    'h-[44px] w-full rounded-[4px] border border-[#b9b9b9] px-3 text-[15px] text-[#212121] outline-none focus:border-[#212121]';

  return (
    <div className={listSectionClass}>
      <h2 className={listTitleClass}>{title}</h2>

      <p className="mb-4 text-[14px] leading-[1.6] text-[#757575]">
        메인·마이페이지 인사말 옆에 뜨는 문장입니다.
        <br />
        <strong className="font-semibold text-[#212121]">
          지금 노출 중인 문장: {showingCount}개
        </strong>
        {showingCount === 0 && ' — 오늘 보여 줄 문장이 없어 인사말 옆이 비어 있습니다.'}
      </p>

      {/* 등록 · 수정 폼 */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col gap-3 rounded-[8px] border border-black/10 p-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold text-[#212121]">
            {isEdit ? '문장 수정' : '새 문장 등록'}
          </span>
          {isEdit && (
            <button
              type="button"
              onClick={() => setForm(freshForm())}
              className="text-[13px] text-[#919191] underline hover:text-[#212121]"
            >
              취소하기
            </button>
          )}
        </div>

        <textarea
          value={form.content}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          placeholder="문장을 입력하세요."
          rows={2}
          maxLength={500}
          className="w-full resize-none rounded-[4px] border border-[#b9b9b9] px-3 py-2 text-[15px] leading-[1.6] text-[#212121] outline-none focus:border-[#212121]"
        />

        {/* 노출 기간: 버튼을 누르면 일정 등록과 같은 달력이 뜬다 (시작일 → 종료일 두 번 클릭) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[12px] text-[#919191]">노출 기간</span>
            <div className="relative">
              <button
                ref={rangeTriggerRef}
                type="button"
                onClick={() => setRangeOpen((prev) => !prev)}
                aria-haspopup="dialog"
                aria-expanded={rangeOpen}
                className={`${inputClass} flex items-center justify-between text-left`}
              >
                <span>
                  {form.startDate && form.endDate
                    ? `${form.startDate} ~ ${form.endDate}`
                    : '기간을 골라 주세요'}
                </span>
                <CalendarDays size={18} strokeWidth={1.6} className="shrink-0 text-[#757575]" aria-hidden />
              </button>
              {rangeOpen && (
                <ScheduleDatePicker
                  start={toDateParts(form.startDate)}
                  end={toDateParts(form.endDate || form.startDate)}
                  triggerRef={rangeTriggerRef}
                  onConfirm={(s, e) => {
                    setForm((prev) => ({ ...prev, startDate: partsToInput(s), endDate: partsToInput(e) }));
                    setRangeOpen(false);
                  }}
                  onClose={() => setRangeOpen(false)}
                />
              )}
            </div>
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="h-[44px] rounded-[4px] bg-[#212121] px-6 text-[15px] text-white sm:w-auto"
          >
            {saving ? '저장 중...' : isEdit ? '수정' : '등록'}
          </Button>
        </div>
      </form>

      {/* 검색: 글자 · 날짜 */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 sm:w-[260px] sm:flex-none">
            <SearchInput value={keyword} onChange={setKeyword} placeholder="문장 검색" />
          </div>
          <div className="relative shrink-0">
            <button
              ref={searchTriggerRef}
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              title="이 날 노출되는 문장 찾기"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              className="flex h-12 items-center gap-[6px] rounded-md border border-input bg-white px-3 text-[14px] text-[#212121] md:h-[52px]"
            >
              <CalendarDays size={16} strokeWidth={1.6} className="text-[#757575]" aria-hidden />
              {searchDate || '날짜로 찾기'}
            </button>
            {searchOpen && (
              <ScheduleDatePicker
                start={toDateParts(searchDate || today())}
                end={toDateParts(searchDate || today())}
                triggerRef={searchTriggerRef}
                // 하루만 고르면 되니 시작일만 쓴다
                onConfirm={(s) => {
                  setSearchDate(partsToInput(s));
                  setSearchOpen(false);
                }}
                onClose={() => setSearchOpen(false)}
              />
            )}
          </div>
        </div>
        <span className="text-[13px] text-[#919191] sm:text-right">
          {isSearching ? `검색 결과 ${filtered.length}개` : `전체 ${quotes.length}개`}
          {isSearching && (
            <button
              type="button"
              onClick={() => {
                setKeyword('');
                setSearchDate('');
              }}
              className="ml-2 underline hover:text-[#212121]"
            >
              지우기
            </button>
          )}
        </span>
      </div>

      {/* 목록 — 배지·기간·버튼을 양끝에 나눠 두어 무게가 왼쪽으로만 쏠리지 않게 */}
      <div className="flex flex-col border-t border-[#B9B9B9]">
        {loading ? (
          <p className="py-10 text-center text-[14px] text-[#919191]">불러오는 중...</p>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <p className="text-[14px] text-[#919191]">{error}</p>
            <button
              type="button"
              onClick={load}
              className="text-[14px] text-[#919191] underline hover:text-[#212121]"
            >
              다시 시도
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-[#919191]">
            {quotes.length === 0 ? '등록된 문장이 없습니다.' : '조건에 맞는 문장이 없습니다.'}
          </p>
        ) : (
          pageQuotes.map((quote) => {
            const start = toInputDate(quote.startDate);
            const end = toInputDate(quote.endDate);
            const live = isLive(quote);

            return (
              <div
                key={quote.quoteId}
                className="flex flex-col gap-2 border-b border-[#B9B9B9] py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                {/* 폰 첫 줄: 배지 왼쪽 · 기간 오른쪽. 넓은 화면에서는 각자 제자리(contents) */}
                <div className="flex items-center justify-between sm:contents">
                  <span
                    className={`inline-flex h-[24px] w-[64px] shrink-0 items-center justify-center rounded-full text-[12px] ${
                      live ? 'bg-[#212121] text-white' : 'border border-[#B9B9B9] text-[#919191]'
                    }`}
                  >
                    {live ? '노출 중' : '대기'}
                  </span>
                  <span className="shrink-0 text-[13px] text-[#919191] sm:order-3">
                    {start} ~ {end}
                  </span>
                </div>

                <p className="min-w-0 flex-1 text-[15px] leading-[1.6] text-[#212121] sm:order-2">
                  {quote.content}
                </p>

                <div className="flex shrink-0 justify-end gap-2 sm:order-4">
                  <button
                    type="button"
                    onClick={() => startEdit(quote)}
                    className="rounded-[4px] border border-[#b9b9b9] px-3 py-1 text-[13px] text-[#212121] hover:bg-[#F5F5F5]"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(quote)}
                    className="rounded-[4px] border border-[#b9b9b9] px-3 py-1 text-[13px] text-[#212121] hover:bg-[#F5F5F5]"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && !error && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <PaginationWithEllipsis
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={`'${(deleteTarget?.content ?? '').slice(0, 20)}…' 문장을 삭제할까요?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
