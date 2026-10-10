'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { getErrorMessage } from '@/apis/auth';
import { getUserDetail } from '@/apis/admin/users';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import { ROUTES } from '@/constants/routes';
import { MEMBER_TYPE_LABELS } from '@/constants/adminMembers';

// 회원 상세 — 회원 목록에서 아이디를 눌러 들어오는 화면 (PM 2026-10-10).
// "이 사람이 누구이고, 얼마나 쓰고, 알림은 받을 수 있는 상태이고, 요즘 들어오긴 하는지" 를 한 화면에.
// 수정·정지·탈퇴는 회원 목록의 기존 기능을 쓴다 — 여기서는 보기만 하고 관련 화면으로 잇는다.

const fmtDate = (iso) => (iso ? String(iso).slice(0, 10) : '-');
const fmtDateTime = (iso) => (iso ? `${String(iso).slice(0, 10)} ${String(iso).slice(11, 16)}` : '-');
const daysAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return diff < 0 ? 0 : diff;
};

const BAN_LABEL = { none: '제재 없음', temporary: '기간 정지', permanent: '영구 차단' };
const SETTING_LABEL = { COMMENT: '댓글', REPLY: '답글', PINNED_POST: '중요 글', EVENT: '일정' };

function Card({ title, children, aside = null }) {
  return (
    <section className="flex flex-col gap-3 rounded-[8px] border border-[#EEEEEE] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold tracking-[-0.3px] text-[#212121]">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[14px] leading-[1.6] tracking-[-0.28px]">
      <span className="shrink-0 text-[#919191]">{label}</span>
      <span className="min-w-0 text-right text-[#212121] [word-break:keep-all]">{children}</span>
    </div>
  );
}

// 최근 30일 — 날짜별 칸. 값이 있으면 진하게, 오늘이 오른쪽 끝
function DailyStrip({ rows = [], max = 1, title }) {
  const byDate = new Map(rows.map((r) => [String(r.date).slice(0, 10), r.count]));
  const days = useMemo(() => {
    const out = [];
    const today = new Date();
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}` });
    }
    return out;
  }, []);
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[2px]">
        {days.map((d) => {
          const v = byDate.get(d.key) ?? 0;
          const level = v === 0 ? 0 : Math.min(4, Math.ceil((v / Math.max(1, max)) * 4));
          const bg = ['#f3f3f3', '#d9d9d9', '#b9b9b9', '#757575', '#212121'][level];
          return (
            <span
              key={d.key}
              title={`${d.label} · ${title} ${v}`}
              className="h-[18px] rounded-[2px]"
              style={{ backgroundColor: bg }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-[#919191]">
        <span>{days[0].label}</span>
        <span>오늘</span>
      </div>
    </div>
  );
}

export default function MemberDetailSection({ userId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    getUserDetail(userId)
      .then((res) => {
        if (alive) setData(res);
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err, '회원 정보를 불러오지 못했습니다.'));
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  const keyword = data?.name ? encodeURIComponent(data.name) : '';
  const accessMax = Math.max(1, ...(data?.accessDaily ?? []).map((r) => r.count));
  const launchMax = Math.max(1, ...(data?.appLaunchDaily ?? []).map((r) => r.count));
  const lastAccessDays = daysAgo(data?.lastAccessAt);

  return (
    <div className={`${listSectionClass} gap-4`}>
      <Link
        href={ROUTES.ADMIN_MEMBER_LIST}
        className="inline-flex items-center gap-[4px] text-[14px] tracking-[-0.28px] text-[#919191] hover:text-[#212121]"
      >
        <ChevronLeft size={16} strokeWidth={2} aria-hidden />
        회원 목록으로 돌아가기
      </Link>

      {error && <p className="py-10 text-center text-[14px] text-[#919191]">{error}</p>}
      {!error && !data && <p className="py-10 text-center text-[14px] text-[#919191]">불러오는 중...</p>}

      {data && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className={`${listTitleClass} !my-0`}>
              {data.isDeleted ? '탈퇴한 회원' : data.name} <span className="text-[16px] font-normal text-[#919191]">({data.loginId})</span>
            </h2>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <span className="rounded-full border border-[#dedede] px-3 py-[2px] text-[#454545]">
                {MEMBER_TYPE_LABELS[data.memberType] ?? data.memberType}
              </span>
              <span className="rounded-full border border-[#dedede] px-3 py-[2px] text-[#454545]">
                {data.adminLevel > 0 ? `관리 Lv.${data.adminLevel}` : '일반회원'}
              </span>
              <span
                className={`rounded-full px-3 py-[2px] ${
                  data.banStatus && data.banStatus !== 'none' ? 'bg-[#ae0000] text-white' : 'border border-[#dedede] text-[#454545]'
                }`}
              >
                {BAN_LABEL[data.banStatus] ?? data.banStatus ?? '제재 없음'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card title="기본 정보">
              <Row label="가입일">{fmtDateTime(data.joinedAt)}</Row>
              <Row label="마지막 로그인">{fmtDateTime(data.lastLoginAt)}</Row>
              <Row label="학번">{data.studentNo ?? '-'}</Row>
              <Row label="전공">{data.major ?? '-'}</Row>
              <Row label="전화번호">{data.phone ?? '-'}</Row>
              <Row label="이메일">{data.email ?? '-'}</Row>
              {data.banStatus && data.banStatus !== 'none' && (
                <Row label="정지 기간">
                  {fmtDate(data.lastBanStartAt)} ~ {data.bannedUntil ? fmtDate(data.bannedUntil) : '영구'}
                </Row>
              )}
            </Card>

            <Card
              title="활동"
              aside={
                <Link href={`${ROUTES.ADMIN_MEMBER_PENALTY}?userId=${data.userId}`} className="text-[13px] text-[#919191] underline underline-offset-2 hover:text-[#212121]">
                  제재 회원 관리
                </Link>
              }
            >
              <Row label="게시글">
                <Link href={`${ROUTES.ADMIN_POSTS}?keyword=${keyword}`} className="underline underline-offset-2">
                  {data.postCount}건
                </Link>
              </Row>
              <Row label="댓글">
                <Link href={`${ROUTES.ADMIN_COMMENTS}?keyword=${keyword}`} className="underline underline-offset-2">
                  {data.commentCount}건
                </Link>
              </Row>
              <Row label="좋아요">누름 {data.likeGivenCount} · 받음 {data.likeReceivedCount}</Row>
              <Row label="유효 주의 / 경고">
                {data.cautionPoints}점 / {data.warningCount}회
              </Row>
            </Card>

            <Card title="알림">
              <Row label="푸시 수신 기기">
                {data.deviceCount > 0 ? `${data.deviceCount}대` : <span className="text-[#ae0000]">없음 (푸시를 받을 수 없음)</span>}
              </Row>
              <Row label="받는 알림">
                {Object.entries(data.notificationSettings ?? {})
                  .map(([type, on]) => `${SETTING_LABEL[type] ?? type} ${on ? '켬' : '끔'}`)
                  .join(' · ')}
              </Row>
              <Row label="알림 끈 글·댓글">{data.muteCount}건</Row>
            </Card>

            <Card title="구글 연동">
              <Row label="연동">{data.googleLinked ? '연동됨' : '안 됨'}</Row>
              {data.googleLinked && (
                <>
                  <Row label="구글 계정">{data.googleEmail ?? '-'}</Row>
                  <Row label="연동일">{fmtDateTime(data.googleLinkedAt)}</Row>
                  <Row label="마지막 동기화">{fmtDateTime(data.googleLastSyncedAt)}</Row>
                </>
              )}
            </Card>

            <Card
              title="접속 (최근 30일)"
              aside={
                <span className="text-[13px] text-[#919191]">
                  {data.accessDays30}일 접속
                  {lastAccessDays != null && ` · 마지막 ${lastAccessDays === 0 ? '오늘' : `${lastAccessDays}일 전`}`}
                </span>
              }
            >
              <DailyStrip rows={data.accessDaily} max={accessMax} title="접속 시간대" />
              <Row label="마지막 접속">{fmtDateTime(data.lastAccessAt)}</Row>
            </Card>

            <Card
              title="앱 실행 (최근 30일)"
              aside={<span className="text-[13px] text-[#919191]">{data.appLaunchDays30}일 실행</span>}
            >
              <DailyStrip rows={data.appLaunchDaily} max={launchMax} title="실행" />
              <Row label="마지막 앱 실행">
                {data.lastAppLaunchAt ? fmtDateTime(data.lastAppLaunchAt) : <span className="text-[#919191]">기록 없음 (웹으로만 접속)</span>}
              </Row>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
