'use client';

import { useCallback, useEffect, useState } from 'react';
import { getForceWithdrawLogs } from '@/apis/admin/sanctions';
import { getErrorMessage } from '@/apis/auth';
import { MEMBER_TYPE_LABELS } from '@/constants/adminMembers';

const SIZE = 10;
const fmt = (iso) => (iso ? `${String(iso).slice(0, 10)} ${String(iso).slice(11, 16)}` : '-');

// 강제 탈퇴 이력 — 제재 회원 관리 화면 아래 (PM 2026-10-17).
// 대상은 가린 이름·아이디와 회원 번호로만 남는다 (탈퇴 즉시 원문 파기 원칙). 보관 1년(정책값)
export default function ForceWithdrawLogSection() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ data: null, isLoading: true, error: null });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getForceWithdrawLogs({ page, size: SIZE, keyword: query });
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      setState({ data: null, isLoading: false, error: getErrorMessage(err, '이력을 불러오지 못했어요') });
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  const items = state.data?.items ?? [];
  const totalPages = state.data?.totalPages ?? 1;

  return (
    <section className="flex flex-col gap-3 rounded-[8px] border border-line p-4 md:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-[18px] font-semibold tracking-[-0.36px] text-ink">강제 탈퇴 이력</h3>
          <p className="mt-0.5 text-[12px] text-ink-3 [word-break:keep-all]">
            이름·아이디는 개인정보 파기 원칙에 따라 가려서 남겨요. 1년이 지나면 자동으로 지워요.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(keyword.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="이름·아이디·사유·회원번호"
            className="h-[36px] w-[200px] rounded-[6px] border border-line-strong bg-surface px-3 text-[13px] text-ink"
          />
          <button type="submit" className="h-[36px] rounded-[6px] bg-inverse px-3 text-[13px] text-inverse-fg">
            검색
          </button>
        </form>
      </div>

      {state.isLoading && !state.data ? (
        <p className="py-6 text-center text-[14px] text-ink-3">불러오는 중…</p>
      ) : state.error ? (
        <p className="py-6 text-center text-[14px] text-danger">{state.error}</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-ink-3">강제 탈퇴 이력이 없어요</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px] tracking-[-0.02em]">
            <thead>
              <tr className="border-b border-line text-ink-3">
                <th className="px-2 py-2 font-medium">처리 일시</th>
                <th className="px-2 py-2 font-medium">대상</th>
                <th className="px-2 py-2 font-medium">신분</th>
                <th className="px-2 py-2 font-medium">사유</th>
                <th className="px-2 py-2 font-medium">처리자</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.logId} className="border-b border-line align-top last:border-b-0">
                  <td className="whitespace-nowrap px-2 py-2 text-ink-2">{fmt(row.createdAt)}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-ink">
                    {row.maskedName ?? '-'} <span className="text-ink-3">({row.maskedLoginId ?? '-'})</span>
                    <span className="ml-1 text-[12px] text-ink-4">#{row.userId}</span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-ink-2">{MEMBER_TYPE_LABELS[row.memberType] ?? row.memberType ?? '-'}</td>
                  <td className="px-2 py-2 text-ink [word-break:keep-all]">{row.reason}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-ink-2">{row.withdrawnByName ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-[13px] text-ink-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
            이전
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">
            다음
          </button>
        </div>
      )}
    </section>
  );
}
