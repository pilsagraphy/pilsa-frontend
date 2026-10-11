'use client';

import { useMemo, useState } from 'react';
import { toast } from '@/lib/toast';

// 앱 접속 점검 — 날짜 하나를 골라 "앱을 연 사람 / 안 연 사람" 명단을 본다.
// Play 비공개 테스트 조건("매일 앱 아이콘으로 접속")을 회원별로 확인해 안 지킨 사람에게 연락하려는 화면 (PM, 2026-09-26).
//
// report: GET /api/admin/monitoring/app-launches 응답. 정렬은 서버가 한다 (안 연 사람 · 연속 미접속 긴 순 → 연 사람 · 이른 시각 순)

const TYPE_LABEL = { STUDENT: '재학', ALUMNI: '졸업' };
const FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'STUDENT', label: '재학생' },
  { key: 'ALUMNI', label: '졸업생' },
];

const hhmm = (iso) => (iso ? String(iso).slice(11, 16) : '');
const md = (date) => (date ? `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}` : '');

export default function AppLaunchPanel({ date, onDateChange, report, isLoading, error }) {
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState(''); // 이름 검색 (PM, 2026-09-26)

  const members = useMemo(() => {
    const list = report?.members ?? [];
    const q = query.trim();
    return list.filter((m) => (filter === 'ALL' || m.memberType === filter) && (!q || (m.name ?? '').includes(q)));
  }, [report, filter, query]);
  const notLaunched = members.filter((m) => !m.launched);
  const launched = members.filter((m) => m.launched);

  // 독촉용 — 안 연 사람 이름을 한 줄로 복사
  const copyNames = async () => {
    const text = notLaunched.map((m) => m.name).join(', ');
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${notLaunched.length}명 이름을 복사했습니다`);
    } catch {
      toast.error('복사하지 못했습니다');
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-ink md:text-[20px]">
            앱 접속 점검
          </h3>
          <p className="text-[13px] leading-[1.6] tracking-[-0.26px] text-ink-3">
            설치형 앱(플레이스토어)으로 연 회원만 셉니다. 브라우저로 들어온 것은 &quot;웹&quot;으로 따로 표시합니다.
            {report?.trackingSince && ` 기록 시작 ${report.trackingSince}.`}
          </p>
        </div>
        <label className="flex items-center gap-2 text-[14px] text-ink">
          날짜
          <input
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="h-[40px] rounded-[6px] border border-line px-3 text-[14px] outline-none focus:border-ink-3"
          />
        </label>
      </div>

      {isLoading && <p className="py-6 text-center text-[14px] text-ink-3">불러오는 중...</p>}
      {!isLoading && error && <p className="py-6 text-center text-[14px] text-ink-3">{error}</p>}

      {!isLoading && !error && report && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: '점검 대상', value: report.totalMembers },
              { label: '앱 열었음', value: report.launchedCount, tone: 'text-link' },
              { label: '안 열었음', value: report.notLaunchedCount, tone: 'text-danger' },
              { label: '웹으로만 접속', value: report.webOnlyCount },
            ].map((c) => (
              <div key={c.label} className="rounded-[8px] border border-line px-4 py-3">
                <p className="text-[12px] text-ink-3">{c.label}</p>
                <p className={`text-[24px] font-bold leading-[1.3] ${c.tone ?? 'text-ink'}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* 필터 · 이름 검색 · 복사 */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`h-[32px] rounded-full px-3 text-[13px] transition-colors ${
                      filter === f.key ? 'bg-inverse text-inverse-fg' : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름 검색"
                aria-label="이름 검색"
                className="h-[32px] w-[140px] rounded-[6px] border border-line px-3 text-[13px] outline-none focus:border-ink-3"
              />
            </div>
            <button
              type="button"
              onClick={copyNames}
              disabled={!notLaunched.length}
              className="h-[32px] rounded-[6px] border border-ink px-3 text-[13px] text-ink transition-colors hover:bg-surface-2 disabled:opacity-40"
            >
              안 연 사람 이름 복사 ({notLaunched.length})
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* 안 연 사람 */}
            <div className="rounded-[8px] border border-line">
              <div className="flex items-center justify-between border-b border-line px-4 py-2">
                <span className="text-[14px] font-semibold text-danger">안 열었음 · {notLaunched.length}명</span>
                <span className="text-[12px] text-ink-3">연속 미접속 긴 순</span>
              </div>
              <ul className="max-h-[520px] divide-y divide-line overflow-y-auto">
                {notLaunched.length === 0 && (
                  <li className="px-4 py-6 text-center text-[13px] text-ink-3">전원 접속했습니다 🎉</li>
                )}
                {notLaunched.map((m) => (
                  <li key={m.userId} className="flex items-center gap-3 px-4 py-2 text-[14px]">
                    <span className="w-[64px] shrink-0 font-medium text-ink">{m.name}</span>
                    <span className="w-[32px] shrink-0 text-[12px] text-ink-3">{TYPE_LABEL[m.memberType] ?? ''}</span>
                    <span className="shrink-0 rounded-full bg-danger-bg px-2 py-[2px] text-[12px] text-danger">
                      {m.missStreak > 0 ? `${m.missStreak}일째 미접속` : '오늘 미접속'}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right text-[12px] text-ink-3">
                      {m.webAccessedAt ? `웹 ${hhmm(m.webAccessedAt)} 접속` : ''}
                      {m.lastLaunchDate ? ` · 마지막 앱 ${md(m.lastLaunchDate)}` : ' · 앱 기록 없음'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 연 사람 */}
            <div className="rounded-[8px] border border-line">
              <div className="flex items-center justify-between border-b border-line px-4 py-2">
                <span className="text-[14px] font-semibold text-link">앱 열었음 · {launched.length}명</span>
                <span className="text-[12px] text-ink-3">처음 연 시각 순</span>
              </div>
              <ul className="max-h-[520px] divide-y divide-line overflow-y-auto">
                {launched.length === 0 && (
                  <li className="px-4 py-6 text-center text-[13px] text-ink-3">아직 아무도 앱을 열지 않았습니다</li>
                )}
                {launched.map((m) => (
                  <li key={m.userId} className="flex items-center gap-3 px-4 py-2 text-[14px]">
                    <span className="w-[64px] shrink-0 font-medium text-ink">{m.name}</span>
                    <span className="w-[32px] shrink-0 text-[12px] text-ink-3">{TYPE_LABEL[m.memberType] ?? ''}</span>
                    <span className="text-[12px] text-ink-2">{hhmm(m.launchedAt)}</span>
                    <span className="min-w-0 flex-1 truncate text-right text-[12px] text-ink-3">
                      {m.launchCount > 1 ? `${m.launchCount}회` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
