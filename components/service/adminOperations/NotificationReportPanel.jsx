'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getErrorMessage } from '@/apis/auth';
import { getNotificationRecipients, getNotificationReport } from '@/apis/admin/monitoring';
import { ROUTES } from '@/constants/routes';

// 운영 관리 > 모니터링 > 알림 발송·읽음 (PM 2026-10-20).
// notifications 행 기준 — 알림함 알림과 푸시 전용(주간 인기 글, push_only)을 함께 센다. 읽음 = 알림함·푸시를 눌러 읽음 처리된 것.
// 기기에 실제로 도착했는지는 저장하지 않는다.

const TYPE_LABEL = {
  COMMENT: '댓글',
  REPLY: '답글',
  REPORT_RESOLVED: '신고 처리',
  SANCTION: '제재',
  NOTICE: '공지',
  PINNED_POST: '중요 글',
  EVENT: '일정',
  TRENDING: '인기 글',
};
const typeLabel = (t) => TYPE_LABEL[t] ?? t;
const num = (v) => (v == null ? '-' : Number(v).toLocaleString('ko-KR'));
const pct = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}%` : '-');
const fmtDateTime = (iso) => (iso ? `${String(iso).slice(5, 10)} ${String(iso).slice(11, 16)}` : '-');
const fmtMinutes = (m) => {
  if (m == null) return '-';
  if (m < 60) return `${m}분`;
  if (m < 60 * 24) return `${Math.round(m / 6) / 10}시간`;
  return `${Math.round(m / 144) / 10}일`;
};

const th = 'px-3 py-2 font-medium';
const thR = 'px-3 py-2 text-right font-medium';
const td = 'px-3 py-2';
const tdR = 'px-3 py-2 text-right';

function Recipients({ date, type }) {
  const [state, setState] = useState({ rows: null, error: null });
  useEffect(() => {
    let alive = true;
    setState({ rows: null, error: null });
    getNotificationRecipients(date, type)
      .then((rows) => alive && setState({ rows, error: null }))
      .catch((err) => alive && setState({ rows: null, error: getErrorMessage(err, '불러오지 못했습니다.') }));
    return () => {
      alive = false;
    };
  }, [date, type]);

  if (state.error) return <p className="py-3 text-center text-[13px] text-ink-3">{state.error}</p>;
  if (!state.rows) return <p className="py-3 text-center text-[13px] text-ink-3">불러오는 중...</p>;
  if (!state.rows.length) return <p className="py-3 text-center text-[13px] text-ink-3">수신자가 없습니다.</p>;
  return (
    <div className="max-h-[360px] overflow-auto">
      <table className="w-full min-w-[480px] text-[12px]">
        <thead className="sticky top-0 bg-surface-2 text-left text-ink-2">
          <tr>
            <th className={th}>이름</th>
            <th className={th}>아이디</th>
            <th className={th}>보낸 시각</th>
            <th className={th}>읽음</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {state.rows.map((r) => (
            <tr key={r.notificationId}>
              <td className={td}>
                {r.userId ? (
                  <Link href={ROUTES.ADMIN_MEMBER_DETAIL(r.userId)} className="text-ink hover:underline">
                    {r.name ?? '(탈퇴)'}
                  </Link>
                ) : (
                  '-'
                )}
              </td>
              <td className={`${td} text-ink-3`}>{r.loginId ?? '-'}</td>
              <td className={`${td} text-ink-3`}>{fmtDateTime(r.sentAt)}</td>
              <td className={td}>
                {r.read ? (
                  <span className="text-ink">{`읽음 ${fmtDateTime(r.readAt)}`}</span>
                ) : (
                  <span className="text-ink-4">안 읽음</span>
                )}
                {r.state === 'deleted' && <span className="ml-1 text-[11px] text-ink-4">(알림함에서 삭제)</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function NotificationReportPanel({ Block }) {
  const [days, setDays] = useState(30);
  const [state, setState] = useState({ data: null, isLoading: true, error: null });
  const [open, setOpen] = useState(null); // `${date}|${type}`

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    setOpen(null);
    getNotificationReport(days)
      .then((data) => alive && setState({ data, isLoading: false, error: null }))
      .catch((err) => alive && setState({ data: null, isLoading: false, error: getErrorMessage(err, '불러오지 못했습니다.') }));
    return () => {
      alive = false;
    };
  }, [days]);

  const pill = (active) =>
    `h-[30px] rounded-full px-3 text-[13px] transition-colors ${
      active ? 'bg-inverse text-inverse-fg' : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
    }`;
  const right = (
    <div className="flex flex-wrap gap-1">
      {[7, 30, 90].map((d) => (
        <button key={d} type="button" onClick={() => setDays(d)} className={pill(days === d)}>
          {`${d}일`}
        </button>
      ))}
    </div>
  );
  const data = state.data;

  return (
    <Block
      title="알림 발송·읽음"
      hint="알림함 알림과 푸시 전용 알림(인기 글)을 함께 셉니다. 읽음은 알림함이나 푸시를 눌러 읽음 처리된 것('모두 읽음' 포함)이고, 기기에 실제로 도착했는지는 남지 않습니다. 묶음을 누르면 받은 회원."
      right={right}
    >
      {state.isLoading ? (
        <p className="py-6 text-center text-[14px] text-ink-3">불러오는 중...</p>
      ) : state.error ? (
        <p className="py-6 text-center text-[14px] text-ink-3">{state.error}</p>
      ) : !data?.types?.length ? (
        <p className="py-6 text-center text-[14px] text-ink-3">{`최근 ${days}일 보낸 알림이 없습니다.`}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="overflow-x-auto rounded-[8px] border border-line">
            <table className="w-full min-w-[480px] text-[13px]">
              <thead className="bg-surface-2 text-left text-ink-2">
                <tr>
                  <th className={th}>종류</th>
                  <th className={thR}>발송</th>
                  <th className={thR}>읽음</th>
                  <th className={thR}>읽음 비율</th>
                  <th className={thR}>읽기까지(중앙값)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.types.map((t) => (
                  <tr key={t.type}>
                    <td className={td}>{typeLabel(t.type)}</td>
                    <td className={tdR}>{num(t.sent)}</td>
                    <td className={tdR}>{num(t.read)}</td>
                    <td className={tdR}>{pct(t.read, t.sent)}</td>
                    <td className={tdR}>{fmtMinutes(t.medianReadMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-[8px] border border-line">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead className="bg-surface-2 text-left text-ink-2">
                <tr>
                  <th className={th}>날짜</th>
                  <th className={th}>종류</th>
                  <th className={th}>제목(최근)</th>
                  <th className={thR}>발송</th>
                  <th className={thR}>읽음</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.batches.map((b) => {
                  const key = `${b.date}|${b.type}`;
                  const isOpen = open === key;
                  return [
                    <tr
                      key={key}
                      onClick={() => setOpen(isOpen ? null : key)}
                      className={`cursor-pointer hover:bg-surface-2 ${isOpen ? 'bg-surface-2' : ''}`}
                    >
                      <td className={td}>{b.date}</td>
                      <td className={td}>{typeLabel(b.type)}</td>
                      <td className={`${td} max-w-[280px] truncate text-ink-3`}>{b.title}</td>
                      <td className={tdR}>{num(b.sent)}</td>
                      <td className={tdR}>
                        {num(b.read)}
                        <span className="ml-1 text-[11px] text-ink-4">{pct(b.read, b.sent)}</span>
                      </td>
                    </tr>,
                    isOpen && (
                      <tr key={`${key}-detail`}>
                        <td colSpan={5} className="bg-surface p-0">
                          <Recipients date={b.date} type={b.type} />
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Block>
  );
}
