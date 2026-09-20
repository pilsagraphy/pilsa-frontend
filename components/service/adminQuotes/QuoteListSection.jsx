'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getErrorMessage } from '@/apis/auth';
import { createQuote, deleteQuote, getAdminQuotes, updateQuote } from '@/apis/admin/quotes';
import { Button } from '@/components/ui/button';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';

// 'YYYY-MM-DD'
const toInputDate = (value) => String(value ?? '').slice(0, 10);

const today = () => new Date().toISOString().slice(0, 10);

// 기본 노출 기간: 오늘부터 한 달. 짧게 잡아 두고 잊으면 메인에서 문장이 사라진다
const defaultEnd = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
};

const EMPTY_FORM = { quoteId: null, content: '', startDate: '', endDate: '' };

/**
 * 이 주의 문장 관리.
 *
 * 메인·마이페이지 인사말 옆에 뜨는 문장이다. 서버는 **오늘이 노출기간에 드는 문장 중 하나를 무작위로**
 * 돌려주므로, 기간이 겹치는 문장이 여러 개면 새로고침할 때마다 바뀌고 하나뿐이면 늘 같은 문장이 나온다.
 * (기간이 지난 문장만 남으면 인사말 옆이 비워진다 — 그 상태를 화면에서 바로 알 수 있게 '노출 중' 을 표시한다)
 */
export default function QuoteListSection({ title = '이 주의 문장' }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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

  const startCreate = () =>
    setForm({ quoteId: null, content: '', startDate: today(), endDate: defaultEnd() });

  const startEdit = (quote) =>
    setForm({
      quoteId: quote.quoteId,
      content: quote.content ?? '',
      startDate: toInputDate(quote.startDate),
      endDate: toInputDate(quote.endDate),
    });

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
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '문장을 저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quote) => {
    const preview = quote.content?.slice(0, 20) ?? '';
    if (!window.confirm(`'${preview}…' 문장을 삭제할까요?`)) return;

    try {
      await deleteQuote(quote.quoteId);
      toast.success('문장을 삭제했습니다.');
      if (form.quoteId === quote.quoteId) setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '문장을 삭제하지 못했습니다.'));
    }
  };

  const now = today();
  const showingCount = quotes.filter(
    (q) => toInputDate(q.startDate) <= now && now <= toInputDate(q.endDate)
  ).length;

  const inputClass =
    'h-[44px] w-full rounded-[4px] border border-[#b9b9b9] px-3 text-[15px] text-[#212121] outline-none focus:border-[#212121]';

  return (
    <div className={listSectionClass}>
      <h2 className={listTitleClass}>{title}</h2>

      <p className="mb-4 text-[14px] leading-[1.6] text-[#757575]">
        메인·마이페이지 인사말 옆에 뜨는 문장입니다. 오늘이 노출 기간에 드는 문장 중 하나가 무작위로
        나오므로, 기간이 겹치는 문장을 여러 개 두면 새로고침할 때마다 바뀝니다.{' '}
        <strong className="font-semibold text-[#212121]">지금 노출 중인 문장 {showingCount}개</strong>
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
              onClick={() => setForm(EMPTY_FORM)}
              className="text-[13px] text-[#919191] underline hover:text-[#212121]"
            >
              새로 등록하기
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[12px] text-[#919191]">노출 시작일</span>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[12px] text-[#919191]">노출 종료일</span>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className={inputClass}
            />
          </label>
          <div className="flex gap-2">
            {!isEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={startCreate}
                className="h-[44px] rounded-[4px] border-[#b9b9b9] px-4 text-[15px] text-[#212121]"
              >
                기간 채우기
              </Button>
            )}
            <Button
              type="submit"
              disabled={saving}
              className="h-[44px] rounded-[4px] bg-[#212121] px-5 text-[15px] text-white"
            >
              {saving ? '저장 중...' : isEdit ? '수정' : '등록'}
            </Button>
          </div>
        </div>
      </form>

      {/* 목록 */}
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
        ) : quotes.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-[#919191]">등록된 문장이 없습니다.</p>
        ) : (
          quotes.map((quote) => {
            const start = toInputDate(quote.startDate);
            const end = toInputDate(quote.endDate);
            const live = start <= now && now <= end;

            return (
              <div
                key={quote.quoteId}
                className="flex flex-col gap-2 border-b border-[#B9B9B9] py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <span
                  className={`inline-flex h-[24px] w-[64px] shrink-0 items-center justify-center rounded-full text-[12px] ${
                    live ? 'bg-[#212121] text-white' : 'border border-[#B9B9B9] text-[#919191]'
                  }`}
                >
                  {live ? '노출 중' : '대기'}
                </span>

                <p className="min-w-0 flex-1 text-[15px] leading-[1.6] text-[#212121]">
                  {quote.content}
                </p>

                <span className="shrink-0 text-[13px] text-[#919191]">
                  {start} ~ {end}
                </span>

                <div className="flex shrink-0 gap-2">
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
    </div>
  );
}
