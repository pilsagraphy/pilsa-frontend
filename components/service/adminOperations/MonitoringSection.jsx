'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getErrorMessage } from '@/apis/auth';
import {
  getAppLaunchReport,
  getBoardActivity,
  getDailyAccess,
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
          <h3 className="text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-[#212121] md:text-[20px]">{title}</h3>
          {hint && <p className="text-[13px] leading-[1.6] tracking-[-0.26px] text-[#919191]">{hint}</p>}
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
  if (state.isLoading) return <p className="py-6 text-center text-[14px] text-[#919191]">불러오는 중...</p>;
  if (state.error) return <p className="py-6 text-center text-[14px] text-[#919191]">{state.error}</p>;
  return children;
};

function Card({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-1 rounded-[8px] border border-[#EEEEEE] bg-white px-4 py-3">
      <span className="text-[12px] text-[#919191]">{label}</span>
      <span className="text-[22px] font-semibold leading-none tracking-[-0.02em] text-[#212121]">{value}</span>
      {sub && <span className="text-[11px] text-[#b9b9b9]">{sub}</span>}
    </div>
  );
}

// 회원 목록 표 (미접속 · 푸시 미등록 · 활동 상위 공용)
function MemberTable({ rows, columns, empty }) {
  if (!rows?.length) return <p className="py-6 text-center text-[14px] text-[#919191]">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-[8px] border border-[#EEEEEE]">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead className="bg-[#F7F8F9] text-left text-[#5f5f5f]">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 font-medium ${c.right ? 'text-right' : ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F3F3F3]">
          {rows.map((m, i) => (
            <tr key={m.userId}>
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 ${c.right ? 'text-right' : ''} ${c.muted ? 'text-[#919191]' : ''}`}>
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

const nameCell = (m) => (
  <Link href={ROUTES.ADMIN_MEMBER_DETAIL(m.userId)} className="text-[#212121] hover:underline">
    {m.name}
    {m.adminLevel > 0 && <span className="ml-1 text-[11px] text-[#919191]">관리</span>}
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
      active ? 'bg-[#212121] text-white' : 'bg-[#F3F3F3] text-[#5f5f5f] hover:bg-[#e8e8e8]'
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
        <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]">
          앱 접속 점검과 접속 · 가입 · 게시판 · 급상승 통계입니다. 접속 통계는 인증된 요청이 있던 시간대를 1로 세므로 브라우저 · 앱 구분이 없고,
          앱 접속 점검만 앱으로 연 경우를 따로 셉니다.
        </p>
      </div>

      {/* 0. 요약 카드 */}
      <Status state={summary}>
        {s && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Card label="오늘 접속 (DAU)" value={num(s.dau)} sub={`7일 ${num(s.wau)} · 30일 ${num(s.mau)}`} />
            <Card label="회원" value={num(s.membersTotal)} sub={`이달 가입 ${num(s.signupsThisMonth)}`} />
            <Card label="글 · 댓글 (7일)" value={`${num(s.postsLast7)} · ${num(s.commentsLast7)}`} sub={`30일 ${num(s.postsLast30)} · ${num(s.commentsLast30)}`} />
            <Card label="신고 대기" value={num(s.pendingReports)} sub="대상(글·댓글) 단위" />
            <Card label="푸시 등록 회원" value={num(s.pushRegisteredMembers)} sub={`미등록 ${num(s.membersTotal - s.pushRegisteredMembers)}`} />
            <Card label="활동 비율 (30일)" value={s.membersTotal ? `${Math.round((s.mau / s.membersTotal) * 100)}%` : '-'} sub="30일 접속 ÷ 회원" />
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
              { name: '접속 회원', color: '#212121', values: dailyRows.map((r) => r.activeUsers) },
              { name: '앱으로 연 회원', color: '#1a73e8', values: dailyRows.map((r) => r.appLaunches) },
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
            series={[{ name: '접속 회원', color: '#212121', values: hourlyRows.map((r) => r.count) }]}
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
              { name: '재학생', color: '#212121', values: signupRows.map((r) => r.studentCount) },
              { name: '졸업생', color: '#919191', values: signupRows.map((r) => r.alumniCount) },
            ]}
          />
        </Status>
      </Block>

      {/* 게시판 활동 */}
      <Block title="게시판 활동" hint="기간 안 게시판별 글·댓글·좋아요 수와 날짜별 전체 글·댓글 수." right={dayPills(boardDays, setBoardDays, [7, 30, 90])}>
        <Status state={boards}>
          {boards.data && (
            <div className="flex flex-col gap-3">
              <div className="overflow-x-auto rounded-[8px] border border-[#EEEEEE]">
                <table className="w-full min-w-[420px] text-[13px]">
                  <thead className="bg-[#F7F8F9] text-left text-[#5f5f5f]">
                    <tr>
                      <th className="px-3 py-2 font-medium">게시판</th>
                      <th className="px-3 py-2 text-right font-medium">글</th>
                      <th className="px-3 py-2 text-right font-medium">댓글</th>
                      <th className="px-3 py-2 text-right font-medium">좋아요</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F3F3]">
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
                  { name: '글', color: '#212121', values: boards.data.daily.map((r) => r.posts) },
                  { name: '댓글', color: '#1a73e8', values: boards.data.daily.map((r) => r.comments) },
                ]}
              />
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
