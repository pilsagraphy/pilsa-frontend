'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getErrorMessage } from '@/apis/auth';
import {
  getAppLaunchReport,
  getBoardActivity,
  getCalendarIssues,
  getCohortRetention,
  getContentReaction,
  getDailyAccess,
  getHealthSignals,
  getHourlyAccess,
  getInactiveMembers,
  getMonitoringSummary,
  getPushUnregistered,
  getTopMembers,
  getTrending,
  getTrendingPolicy,
  getWeeklySignups,
} from '@/apis/admin/monitoring';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import { ROUTES } from '@/constants/routes';
import AppLaunchPanel from './AppLaunchPanel';
import NotificationReportPanel from './NotificationReportPanel';
import SimpleLineChart from './SimpleLineChart';
import SimpleBarChart from './SimpleBarChart';
import TrendingTable from './TrendingTable';

// 운영 관리 > 모니터링 (10/10 밤 고도화 — "보통의 커뮤니티가 필요한 내용").
//  0. 요약 카드 — DAU/WAU/MAU · 회원 · 이달 가입 · 글·댓글 · 신고 대기 · 푸시 등록
//  1. 앱 접속 점검 — 날짜별로 앱을 연 사람 / 안 연 사람 (Play 테스트 기간 독촉용)
//  2. 그래프 — 통계 테이블(stats_access_hourly · stats_signup_weekly · stats_post_hourly)을 그대로 그린다
//  3. 게시판 활동 · 미접속 회원 · 푸시 미등록 회원 · 활동 상위 회원 · 급상승(글 기준 묶기 + 미선정 관문 표기)

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const mdLabel = (date) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
const fmtDateTime = (iso) => (iso ? `${String(iso).slice(0, 10)} ${String(iso).slice(11, 16)}` : '-');
const num = (v) => (v == null ? '-' : Number(v).toLocaleString('ko-KR'));
const MEMBER_TYPE = { STUDENT: '재학', ALUMNI: '졸업' };

function Block({ title, hint, right, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-ink md:text-[20px]">{title}</h3>
          {hint && <p className="text-[13px] leading-[1.6] tracking-[-0.26px] text-ink-3">{hint}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

const useFetch = (loader, deps) => {
  const [state, setState] = useState({ data: null, isLoading: true, error: null });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    loader()
      .then((data) => alive && setState({ data, isLoading: false, error: null }))
      .catch((err) => alive && setState({ data: null, isLoading: false, error: getErrorMessage(err, '불러오지 못했습니다.') }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
};

const Status = ({ state, children }) => {
  if (state.isLoading) return <p className="py-6 text-center text-[14px] text-ink-3">불러오는 중...</p>;
  if (state.error) return <p className="py-6 text-center text-[14px] text-ink-3">{state.error}</p>;
  return children;
};

function Card({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-1 rounded-[8px] border border-line bg-surface px-4 py-3">
      <span className="text-[12px] text-ink-3">{label}</span>
      <span className="text-[22px] font-semibold leading-none tracking-[-0.02em] text-ink">{value}</span>
      {sub && <span className="text-[11px] text-ink-4">{sub}</span>}
    </div>
  );
}

// 회원 목록 표 (미접속 · 푸시 미등록 · 활동 상위 공용)
function MemberTable({ rows, columns, empty }) {
  if (!rows?.length) return <p className="py-6 text-center text-[14px] text-ink-3">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-[8px] border border-line">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead className="bg-surface-2 text-left text-ink-2">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 font-medium ${c.right ? 'text-right' : ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((m, i) => (
            <tr key={m.userId}>
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 ${c.right ? 'text-right' : ''} ${c.muted ? 'text-ink-3' : ''}`}>
                  {c.render ? c.render(m, i) : m[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 비율 칸 — 분모가 0 이면(창이 아직 안 지남) '-'
const pct = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}%` : '-');
const fmtMinutes = (m) => {
  if (m == null) return '-';
  if (m < 60) return `${m}분`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}시간 ${m % 60}분`;
  return `${Math.floor(m / 1440)}일 ${Math.floor((m % 1440) / 60)}시간`;
};
const CALENDAR_PROVIDER = { google: '구글', kakao: '톡캘린더', naver: '네이버' };

const nameCell = (m) => (
  <Link href={ROUTES.ADMIN_MEMBER_DETAIL(m.userId)} className="text-ink hover:underline">
    {m.name}
    {m.adminLevel > 0 && <span className="ml-1 text-[11px] text-ink-3">관리</span>}
  </Link>
);

export default function MonitoringSection() {
  const [date, setDate] = useState(todayStr);
  const [days, setDays] = useState(30);
  const [boardDays, setBoardDays] = useState(30);
  const [inactiveDays, setInactiveDays] = useState(14);
  const [topDays, setTopDays] = useState(30);
  const [trendingHours, setTrendingHours] = useState(48);
  const [onlyTrending, setOnlyTrending] = useState(false);
  const [grouped, setGrouped] = useState(true);

  const summary = useFetch(useCallback(() => getMonitoringSummary(), []), []);
  const report = useFetch(useCallback(() => getAppLaunchReport(date), [date]), [date]);
  const daily = useFetch(useCallback(() => getDailyAccess(days), [days]), [days]);
  const hourly = useFetch(useCallback(() => getHourlyAccess(date), [date]), [date]);
  const signups = useFetch(useCallback(() => getWeeklySignups(12), []), []);
  const boards = useFetch(useCallback(() => getBoardActivity(boardDays), [boardDays]), [boardDays]);
  const inactive = useFetch(useCallback(() => getInactiveMembers(inactiveDays), [inactiveDays]), [inactiveDays]);
  const noPush = useFetch(useCallback(() => getPushUnregistered(), []), []);
  const top = useFetch(useCallback(() => getTopMembers(topDays, 10), [topDays]), [topDays]);
  const policy = useFetch(useCallback(() => getTrendingPolicy(), []), []);
  const cohort = useFetch(useCallback(() => getCohortRetention(12), []), []);
  const reaction = useFetch(useCallback(() => getContentReaction(30), []), []);
  const calendarIssues = useFetch(useCallback(() => getCalendarIssues(7), []), []);
  const health = useFetch(useCallback(() => getHealthSignals(), []), []);
  // 연동 장애 카드를 누르면 그 회원 목록 — `${issue}:${provider}` (STALE 은 provider 무관)
  const [issueFilter, setIssueFilter] = useState(null);
  const trending = useFetch(
    useCallback(() => getTrending({ hours: trendingHours, onlyTrending, limit: 200 }), [trendingHours, onlyTrending]),
    [trendingHours, onlyTrending]
  );

  const dailyRows = daily.data ?? [];
  const hourlyRows = hourly.data ?? [];
  const signupRows = signups.data ?? [];
  const s = summary.data;

  const pill = (active) =>
    `h-[30px] rounded-full px-3 text-[13px] transition-colors ${
      active ? 'bg-inverse text-inverse-fg' : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
    }`;
  const dayPills = (value, set, options) => (
    <div className="flex flex-wrap gap-1">
      {options.map((n) => (
        <button key={n} type="button" className={pill(value === n)} onClick={() => set(n)}>
          {n}일
        </button>
      ))}
    </div>
  );

  return (
    <div className={`${listSectionClass} gap-10`}>
      <div>
        <h2 className={listTitleClass}>모니터링</h2>
        <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-ink-3">
          앱 접속 점검과 접속 · 가입 · 게시판 · 급상승 통계입니다. 접속 통계는 인증된 요청이 있던 시간대를 1로 세므로 브라우저 · 앱 구분이 없고,
          앱 접속 점검만 앱으로 연 경우를 따로 셉니다.
        </p>
      </div>

      {/* 0. 요약 카드 */}
      <Status state={summary}>
        {s && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
            <Card label="오늘 접속 (DAU)" value={num(s.dau)} sub={`7일 ${num(s.wau)} · 30일 ${num(s.mau)}`} />
            <Card label="회원" value={num(s.membersTotal)} sub={`이달 가입 ${num(s.signupsThisMonth)}`} />
            <Card label="글 · 댓글 (7일)" value={`${num(s.postsLast7)} · ${num(s.commentsLast7)}`} sub={`30일 ${num(s.postsLast30)} · ${num(s.commentsLast30)}`} />
            <Card label="신고 대기" value={num(s.pendingReports)} sub="대상(글·댓글) 단위" />
            <Card label="푸시 등록 회원" value={num(s.pushRegisteredMembers)} sub={`미등록 ${num(s.membersTotal - s.pushRegisteredMembers)}`} />
            <Card label="활동 비율 (30일)" value={s.membersTotal ? `${Math.round((s.mau / s.membersTotal) * 100)}%` : '-'} sub="30일 접속 ÷ 회원" />
            {/* 간편로그인·캘린더 연동 현황 (PM 2026-10-13) — 제공자별 수는 한 회원이 여럿 연결하면 각각 센다 */}
            <Card
              label="간편로그인 연결 회원"
              value={num(s.socialLinkedMembers)}
              sub={`구글 ${num(s.socialByProvider?.GOOGLE ?? 0)} · 네이버 ${num(s.socialByProvider?.NAVER ?? 0)} · 카카오 ${num(s.socialByProvider?.KAKAO ?? 0)} · 비번 없음 ${num(s.socialOnlyMembers)}`}
            />
            <Card
              label="캘린더 연동 회원"
              value={num(s.calendarLinkedMembers)}
              sub={`구글 ${num(s.calendarByProvider?.google ?? 0)} · 톡 ${num(s.calendarByProvider?.kakao ?? 0)} · 네이버 ${num(s.calendarByProvider?.naver ?? 0)}`}
            />
          </div>
        )}
      </Status>

      <AppLaunchPanel date={date} onDateChange={setDate} report={report.data} isLoading={report.isLoading} error={report.error} />

      <Block title="일별 접속" hint="하루에 한 번이라도 인증된 요청이 있던 회원 수와 그중 앱으로 연 회원 수." right={dayPills(days, setDays, [14, 30, 90])}>
        <Status state={daily}>
          <SimpleLineChart
            labels={dailyRows.map((r) => r.date)}
            formatLabel={mdLabel}
            series={[
              { name: '접속 회원', color: 'rgb(var(--c-ink))', values: dailyRows.map((r) => r.activeUsers) },
              { name: '앱으로 연 회원', color: 'rgb(var(--c-link))', values: dailyRows.map((r) => r.appLaunches) },
            ]}
          />
        </Status>
      </Block>

      <Block title="시간대별 접속" hint={`${date} 의 시간대별 접속 회원 수 (위 날짜 선택과 같은 날).`}>
        <Status state={hourly}>
          <SimpleBarChart
            labels={hourlyRows.map((r) => String(r.hour))}
            formatLabel={(h) => `${h}시`}
            height={180}
            series={[{ name: '접속 회원', color: 'rgb(var(--c-ink))', values: hourlyRows.map((r) => r.count) }]}
          />
        </Status>
      </Block>

      <Block title="주간 신규 가입" hint="주 시작(월요일) 기준. 새벽 4시 50분 배치가 최근 2주를 다시 계산해 고정한 값입니다.">
        <Status state={signups}>
          <SimpleBarChart
            labels={signupRows.map((r) => r.statWeek)}
            formatLabel={mdLabel}
            height={180}
            series={[
              { name: '재학생', color: 'rgb(var(--c-ink))', values: signupRows.map((r) => r.studentCount) },
              { name: '졸업생', color: 'rgb(var(--c-ink-3))', values: signupRows.map((r) => r.alumniCount) },
            ]}
          />
        </Status>
      </Block>

      {/* 게시판 활동 */}
      <Block title="게시판 활동" hint="기간 안 게시판별 글·댓글·좋아요 수와 날짜별 전체 글·댓글 수." right={dayPills(boardDays, setBoardDays, [7, 30, 90])}>
        <Status state={boards}>
          {boards.data && (
            <div className="flex flex-col gap-3">
              <div className="overflow-x-auto rounded-[8px] border border-line">
                <table className="w-full min-w-[420px] text-[13px]">
                  <thead className="bg-surface-2 text-left text-ink-2">
                    <tr>
                      <th className="px-3 py-2 font-medium">게시판</th>
                      <th className="px-3 py-2 text-right font-medium">글</th>
                      <th className="px-3 py-2 text-right font-medium">댓글</th>
                      <th className="px-3 py-2 text-right font-medium">좋아요</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {boards.data.boards.map((b) => (
                      <tr key={b.boardId}>
                        <td className="px-3 py-2">{b.boardName}</td>
                        <td className="px-3 py-2 text-right">{num(b.postCount)}</td>
                        <td className="px-3 py-2 text-right">{num(b.commentCount)}</td>
                        <td className="px-3 py-2 text-right">{num(b.likeCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <SimpleLineChart
                labels={boards.data.daily.map((r) => r.date)}
                formatLabel={mdLabel}
                height={180}
                series={[
                  { name: '글', color: 'rgb(var(--c-ink))', values: boards.data.daily.map((r) => r.posts) },
                  { name: '댓글', color: 'rgb(var(--c-link))', values: boards.data.daily.map((r) => r.comments) },
                ]}
              />
            </div>
          )}
        </Status>
      </Block>

      {/* 가입 코호트 잔존 */}
      <Block
        title="가입 코호트 잔존"
        hint="가입 주(월요일 기준)별로, 가입일 기준 N주차 7일 동안 한 번이라도 접속한 비율 — 분모는 그 7일이 다 지난 가입자(탈퇴 제외), 최근 12주."
      >
        <Status state={cohort}>
          {cohort.data?.length ? (
            <div className="overflow-x-auto rounded-[8px] border border-line">
              <table className="w-full min-w-[480px] text-[13px]">
                <thead className="bg-surface-2 text-left text-ink-2">
                  <tr>
                    <th className="px-3 py-2 font-medium">가입 주</th>
                    <th className="px-3 py-2 text-right font-medium">가입</th>
                    <th className="px-3 py-2 text-right font-medium">1주 뒤</th>
                    <th className="px-3 py-2 text-right font-medium">2주 뒤</th>
                    <th className="px-3 py-2 text-right font-medium">4주 뒤</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {cohort.data.map((r) => (
                    <tr key={r.weekStart}>
                      <td className="px-3 py-2">{r.weekStart} 주</td>
                      <td className="px-3 py-2 text-right">{num(r.signups)}</td>
                      {[
                        [r.w1Retained, r.w1Eligible],
                        [r.w2Retained, r.w2Eligible],
                        [r.w4Retained, r.w4Eligible],
                      ].map(([kept, base], i) => (
                        <td key={i} className="px-3 py-2 text-right">
                          {pct(kept, base)}
                          {base > 0 && <span className="ml-1 text-[11px] text-ink-4">{`${kept}/${base}`}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-[14px] text-ink-3">최근 12주 가입자가 없습니다.</p>
          )}
        </Status>
      </Block>

      {/* 콘텐츠 반응 */}
      <Block
        title="콘텐츠 반응 (30일)"
        hint="최근 30일 정상 글 기준 — 댓글은 정상·공개 댓글만, 첫 댓글 시간은 글쓴이 본인 댓글을 빼고 댓글 달린 글들의 중앙값."
      >
        <Status state={reaction}>
          {reaction.data && (
            <div className="overflow-x-auto rounded-[8px] border border-line">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead className="bg-surface-2 text-left text-ink-2">
                  <tr>
                    <th className="px-3 py-2 font-medium">게시판</th>
                    <th className="px-3 py-2 text-right font-medium">글</th>
                    <th className="px-3 py-2 text-right font-medium">글당 댓글</th>
                    <th className="px-3 py-2 text-right font-medium">글당 좋아요</th>
                    <th className="px-3 py-2 text-right font-medium">댓글 0개 글</th>
                    <th className="px-3 py-2 text-right font-medium">첫 댓글까지</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {reaction.data.boards.map((b) => (
                    <tr key={b.boardId}>
                      <td className="px-3 py-2">{b.boardName}</td>
                      <td className="px-3 py-2 text-right">{num(b.postCount)}</td>
                      <td className="px-3 py-2 text-right">{b.postCount ? (b.commentCount / b.postCount).toFixed(1) : '-'}</td>
                      <td className="px-3 py-2 text-right">{b.postCount ? (b.likeCount / b.postCount).toFixed(1) : '-'}</td>
                      <td className="px-3 py-2 text-right">{pct(b.zeroCommentPosts, b.postCount)}</td>
                      <td className="px-3 py-2 text-right">{fmtMinutes(b.medianFirstCommentMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Status>
      </Block>

      {/* 알림 발송·읽음 */}
      <NotificationReportPanel Block={Block} />

      {/* 캘린더 연동 장애 */}
      <Block
        title="캘린더 연동 장애"
        hint="구글·톡캘린더는 동기화 실패가 남은 회원, 네이버는 토큰 갱신 실패로 멈춘 회원, 그리고 마지막 반영이 7일 넘게 없는 연동 수. 카드를 누르면 회원 목록."
      >
        <Status state={calendarIssues}>
          {calendarIssues.data &&
            (() => {
              const c = calendarIssues.data;
              const cards = [
                { key: 'FAILED:google', label: '구글 동기화 실패', value: c.googleFailedMembers, sub: '실패 일정이 남은 회원' },
                { key: 'FAILED:kakao', label: '톡캘린더 동기화 실패', value: c.kakaoFailedMembers, sub: '실패 일정이 남은 회원' },
                { key: 'TOKEN:naver', label: '네이버 토큰 만료', value: c.naverStuckMembers, sub: '재연동해야 다시 들어감' },
                { key: 'STALE', label: `${c.staleDays}일 넘게 반영 없음`, value: c.staleLinks, sub: '연동 단위' },
              ];
              const rows = issueFilter
                ? c.rows.filter((r) => (issueFilter === 'STALE' ? r.issue === 'STALE' : `${r.issue}:${r.provider}` === issueFilter))
                : [];
              return (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {cards.map((card) => (
                      <button
                        key={card.key}
                        type="button"
                        onClick={() => setIssueFilter((f) => (f === card.key ? null : card.key))}
                        className={`rounded-[8px] text-left ${issueFilter === card.key ? 'ring-2 ring-ink' : ''}`}
                      >
                        <Card label={card.label} value={num(card.value)} sub={card.sub} />
                      </button>
                    ))}
                  </div>
                  {issueFilter &&
                    (rows.length ? (
                      <div className="overflow-x-auto rounded-[8px] border border-line">
                        <table className="w-full min-w-[560px] text-[13px]">
                          <thead className="bg-surface-2 text-left text-ink-2">
                            <tr>
                              <th className="px-3 py-2 font-medium">이름</th>
                              <th className="px-3 py-2 font-medium">아이디</th>
                              <th className="px-3 py-2 font-medium">캘린더</th>
                              <th className="px-3 py-2 font-medium">마지막 반영</th>
                              {issueFilter.startsWith('FAILED') && <th className="px-3 py-2 text-right font-medium">실패 (상한 소진)</th>}
                              {issueFilter.startsWith('FAILED') && <th className="px-3 py-2 font-medium">최근 오류</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {rows.map((r) => (
                              <tr key={`${r.issue}-${r.provider}-${r.userId}`}>
                                <td className="px-3 py-2">{nameCell(r)}</td>
                                <td className="px-3 py-2 text-ink-3">{r.loginId}</td>
                                <td className="px-3 py-2">{CALENDAR_PROVIDER[r.provider] ?? r.provider}</td>
                                <td className="px-3 py-2">{fmtDateTime(r.lastReflectedAt)}</td>
                                {issueFilter.startsWith('FAILED') && (
                                  <td className="px-3 py-2 text-right">{`${num(r.failedCount)} (${num(r.exhaustedCount)})`}</td>
                                )}
                                {issueFilter.startsWith('FAILED') && (
                                  <td className="max-w-[280px] truncate px-3 py-2 text-ink-3" title={r.lastError ?? ''}>
                                    {r.lastError ?? '-'}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="py-6 text-center text-[14px] text-ink-3">해당하는 회원이 없습니다.</p>
                    ))}
                </div>
              );
            })()}
        </Status>
      </Block>

      {/* 기타 장애 신호 */}
      <Block
        title="기타 장애 신호"
        hint="DB 에 흔적이 남는 것만 — 접속 기록 3시간·가입 배치 2일 넘게 없으면 '확인 필요'. 푸시·메일 발송 실패와 5xx 오류는 기록이 없어 서버 로그를 봐야 합니다."
      >
        <Status state={health}>
          {health.data && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Card
                label="마지막 접속 기록"
                value={fmtDateTime(health.data.lastAccessHour)}
                sub={health.data.accessStale ? '⚠ 확인 필요 — 3시간 넘게 기록 없음' : '정상'}
              />
              <Card
                label="주간 가입 배치 (04:50)"
                value={fmtDateTime(health.data.lastSignupCapturedAt)}
                sub={health.data.signupBatchStale ? '⚠ 확인 필요 — 2일 넘게 실행 흔적 없음' : '정상'}
              />
              <Card label="마지막 급상승 집계 행" value={fmtDateTime(health.data.lastTrendingHour)} sub="조용한 구간엔 행이 없어 늦어도 정상" />
              <Card label="캘린더 자동 복구 멈춤" value={num(health.data.calendarExhaustedMembers)} sub="재시도 상한 소진 회원 (재연동 필요)" />
            </div>
          )}
        </Status>
      </Block>

      {/* 미접속 회원 */}
      <Block
        title="오래 안 들어온 회원"
        hint="마지막 접속(접속 기록, 없으면 마지막 로그인, 둘 다 없으면 가입일)이 N일보다 오래된 회원. 이름을 누르면 회원 상세."
        right={dayPills(inactiveDays, setInactiveDays, [7, 14, 30, 60])}
      >
        <Status state={inactive}>
          <MemberTable
            rows={inactive.data}
            empty={`${inactiveDays}일 이상 안 들어온 회원이 없습니다.`}
            columns={[
              { key: 'name', label: '이름', render: nameCell },
              { key: 'loginId', label: '아이디', muted: true },
              { key: 'memberType', label: '신분', render: (m) => MEMBER_TYPE[m.memberType] ?? m.memberType },
              { key: 'lastAccessAt', label: '마지막 접속', render: (m) => (m.lastAccessAt ? fmtDateTime(m.lastAccessAt) : '기록 없음') },
              { key: 'daysSince', label: '며칠째', right: true, render: (m) => (m.daysSince == null ? '-' : `${m.daysSince}일`) },
              { key: 'deviceCount', label: '푸시 기기', right: true, render: (m) => (m.deviceCount > 0 ? `${m.deviceCount}대` : '없음') },
            ]}
          />
        </Status>
      </Block>

      {/* 푸시 미등록 회원 */}
      <Block title="푸시 미등록 회원" hint="알림 수신 기기를 하나도 등록하지 않은 회원 — 공지·댓글 푸시를 못 받습니다. 최근 접속 순.">
        <Status state={noPush}>
          <MemberTable
            rows={noPush.data}
            empty="모든 회원이 푸시 기기를 등록했습니다."
            columns={[
              { key: 'name', label: '이름', render: nameCell },
              { key: 'loginId', label: '아이디', muted: true },
              { key: 'memberType', label: '신분', render: (m) => MEMBER_TYPE[m.memberType] ?? m.memberType },
              { key: 'lastAccessAt', label: '마지막 접속', render: (m) => (m.lastAccessAt ? fmtDateTime(m.lastAccessAt) : '기록 없음') },
              { key: 'joinedAt', label: '가입', muted: true, render: (m) => String(m.joinedAt ?? '').slice(0, 10) },
            ]}
          />
        </Status>
      </Block>

      {/* 활동 상위 회원 */}
      <Block title="활동 상위 회원" hint="기간 안 글 + 댓글이 많은 순 (상위 10명)." right={dayPills(topDays, setTopDays, [7, 30, 90])}>
        <Status state={top}>
          <MemberTable
            rows={top.data}
            empty="기간 안 글이나 댓글을 쓴 회원이 없습니다."
            columns={[
              { key: 'rank', label: '순위', render: (m, i) => i + 1 },
              { key: 'name', label: '이름', render: nameCell },
              { key: 'loginId', label: '아이디', muted: true },
              { key: 'postCount', label: '글', right: true },
              { key: 'commentCount', label: '댓글', right: true },
              { key: 'total', label: '합계', right: true, render: (m) => num(m.postCount + m.commentCount) },
            ]}
          />
        </Status>
      </Block>

      <Block
        title="급상승 집계"
        hint="구간(기본 1시간)마다 활동이 기준치를 넘은 글만 행이 생깁니다. 노란 행이 3관문을 통과해 선정된 글 — 미선정 행에는 걸린 관문을 적습니다."
        right={
          <div className="flex flex-wrap gap-1">
            {[24, 48, 168].map((h) => (
              <button key={h} type="button" className={pill(trendingHours === h)} onClick={() => setTrendingHours(h)}>
                {h === 168 ? '7일' : `${h}시간`}
              </button>
            ))}
            <button type="button" className={pill(onlyTrending)} onClick={() => setOnlyTrending((v) => !v)}>
              선정만
            </button>
            <button type="button" className={pill(grouped)} onClick={() => setGrouped((v) => !v)}>
              글 기준으로 묶기
            </button>
          </div>
        }
      >
        <TrendingTable rows={trending.data ?? []} isLoading={trending.isLoading} error={trending.error} policy={policy.data} grouped={grouped} />
      </Block>
    </div>
  );
}
