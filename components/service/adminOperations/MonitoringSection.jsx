'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import {
  getAppLaunchReport,
  getDailyAccess,
  getHourlyAccess,
  getTrending,
  getWeeklySignups,
} from '@/apis/admin/monitoring';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import AppLaunchPanel from './AppLaunchPanel';
import SimpleLineChart from './SimpleLineChart';
import SimpleBarChart from './SimpleBarChart';
import TrendingTable from './TrendingTable';

// 운영 관리 > 모니터링.
//  1. 앱 접속 점검 — 날짜별로 앱을 연 사람 / 안 연 사람 (Play 테스트 기간 독촉용)
//  2. 그래프 — 양영환의 통계 테이블(stats_access_hourly · stats_signup_weekly · stats_post_hourly)을 그대로 그린다
//     (원본 하나에서 파생시킨다 — 일별·시간대별은 서버가 GROUP BY 로 만든 값)

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const mdLabel = (date) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

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

export default function MonitoringSection() {
  const [date, setDate] = useState(todayStr);
  const [days, setDays] = useState(30);
  const [trendingHours, setTrendingHours] = useState(48);
  const [onlyTrending, setOnlyTrending] = useState(false);

  const report = useFetch(useCallback(() => getAppLaunchReport(date), [date]), [date]);
  const daily = useFetch(useCallback(() => getDailyAccess(days), [days]), [days]);
  const hourly = useFetch(useCallback(() => getHourlyAccess(date), [date]), [date]);
  const signups = useFetch(useCallback(() => getWeeklySignups(12), []), []);
  const trending = useFetch(
    useCallback(() => getTrending({ hours: trendingHours, onlyTrending, limit: 60 }), [trendingHours, onlyTrending]),
    [trendingHours, onlyTrending]
  );

  const dailyRows = daily.data ?? [];
  const hourlyRows = hourly.data ?? [];
  const signupRows = signups.data ?? [];

  const pill = (active) =>
    `h-[30px] rounded-full px-3 text-[13px] transition-colors ${
      active ? 'bg-[#212121] text-white' : 'bg-[#F3F3F3] text-[#5f5f5f] hover:bg-[#e8e8e8]'
    }`;

  return (
    <div className={`${listSectionClass} gap-10`}>
      <div>
        <h2 className={listTitleClass}>모니터링</h2>
        <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]">
          앱 접속 점검과 접속 · 가입 · 급상승 통계입니다. 접속 통계는 인증된 요청이 있던 시간대를 1로 세므로 브라우저 · 앱 구분이 없고,
          앱 접속 점검만 앱으로 연 경우를 따로 셉니다.
        </p>
      </div>

      <AppLaunchPanel date={date} onDateChange={setDate} report={report.data} isLoading={report.isLoading} error={report.error} />

      <Block
        title="일별 접속"
        hint="하루에 한 번이라도 인증된 요청이 있던 회원 수와 그중 앱으로 연 회원 수."
        right={
          <div className="flex gap-1">
            {[14, 30, 90].map((n) => (
              <button key={n} type="button" className={pill(days === n)} onClick={() => setDays(n)}>
                {n}일
              </button>
            ))}
          </div>
        }
      >
        {daily.isLoading ? (
          <p className="py-6 text-center text-[14px] text-[#919191]">불러오는 중...</p>
        ) : daily.error ? (
          <p className="py-6 text-center text-[14px] text-[#919191]">{daily.error}</p>
        ) : (
          <SimpleLineChart
            labels={dailyRows.map((r) => r.date)}
            formatLabel={mdLabel}
            series={[
              { name: '접속 회원', color: '#212121', values: dailyRows.map((r) => r.activeUsers) },
              { name: '앱으로 연 회원', color: '#1a73e8', values: dailyRows.map((r) => r.appLaunches) },
            ]}
          />
        )}
      </Block>

      <Block title="시간대별 접속" hint={`${date} 의 시간대별 접속 회원 수 (위 날짜 선택과 같은 날).`}>
        {hourly.isLoading ? (
          <p className="py-6 text-center text-[14px] text-[#919191]">불러오는 중...</p>
        ) : hourly.error ? (
          <p className="py-6 text-center text-[14px] text-[#919191]">{hourly.error}</p>
        ) : (
          <SimpleBarChart
            labels={hourlyRows.map((r) => String(r.hour))}
            formatLabel={(h) => `${h}시`}
            height={180}
            series={[{ name: '접속 회원', color: '#212121', values: hourlyRows.map((r) => r.count) }]}
          />
        )}
      </Block>

      <Block title="주간 신규 가입" hint="주 시작(월요일) 기준. 새벽 4시 50분 배치가 최근 2주를 다시 계산해 고정한 값입니다.">
        {signups.isLoading ? (
          <p className="py-6 text-center text-[14px] text-[#919191]">불러오는 중...</p>
        ) : signups.error ? (
          <p className="py-6 text-center text-[14px] text-[#919191]">{signups.error}</p>
        ) : (
          <SimpleBarChart
            labels={signupRows.map((r) => r.statWeek)}
            formatLabel={mdLabel}
            height={180}
            series={[
              { name: '재학생', color: '#212121', values: signupRows.map((r) => r.studentCount) },
              { name: '졸업생', color: '#919191', values: signupRows.map((r) => r.alumniCount) },
            ]}
          />
        )}
      </Block>

      <Block
        title="급상승 집계"
        hint="구간(기본 1시간)마다 활동이 기준치를 넘은 글만 행이 생깁니다. 노란 행이 3관문을 통과해 선정된 글."
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
          </div>
        }
      >
        <TrendingTable rows={trending.data ?? []} isLoading={trending.isLoading} error={trending.error} />
      </Block>
    </div>
  );
}
