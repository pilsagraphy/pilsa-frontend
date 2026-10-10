'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DETAIL_FROM_MONITORING, getAdminPostDetailHref } from '@/constants/adminPosts';

// 급상승 집계 표 — stats_post_hourly 최근 행. 선정(is_trending)된 행은 노랗게.
// 미선정 행에는 어느 관문에 걸렸는지 적는다 (PM 10/10 "1 과 1위의 차이를 모르겠다"). 기준값은 policy(지금 값)라 과거 행과 다를 수 있다.
// grouped: 같은 글이 여러 구간에 걸쳐 나오는 것을 글 하나로 묶어 보여 주고, 펼치면 구간 이력이 나온다.
const fmtHour = (iso) => (iso ? `${String(iso).slice(5, 10).replace('-', '/')} ${String(iso).slice(11, 13)}시` : '');
const num = (v) => (v == null ? '-' : Number(v).toLocaleString('ko-KR'));

// 미선정 이유 — 3관문 중 걸린 것
function reasonOf(r, policy) {
  if (r.isTrending) return null;
  if (!policy) return '기준 미달';
  const out = [];
  if (Number(r.rawScore) < policy.minScore) out.push(`점수 ${policy.minScore} 미만`);
  if (r.spikeRatio != null && Number(r.spikeRatio) < policy.spikeRatio) out.push(`배수 ×${policy.spikeRatio} 미만`);
  if (r.rankNo != null && r.rankNo > policy.topN) out.push(`순위 ${policy.topN} 밖`);
  return out.length ? out.join(' · ') : '기준 미달';
}

function RankCell({ r, policy }) {
  if (r.isTrending) return <span className="rounded-full bg-[#212121] px-2 py-[2px] text-[12px] text-white">{r.rankNo}위</span>;
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-[#919191]">{r.rankNo ?? '-'}번째</span>
      <span className="text-[11px] text-[#b3261e]">{reasonOf(r, policy)}</span>
    </span>
  );
}

function IntervalRow({ r, policy, indent = false }) {
  return (
    <tr className={r.isTrending ? 'bg-[#FFF8E6]' : ''}>
      <td className={`whitespace-nowrap px-3 py-2 text-[#5f5f5f] ${indent ? 'pl-8' : ''}`}>{fmtHour(r.statHour)}</td>
      <td className="px-3 py-2">
        <RankCell r={r} policy={policy} />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-[#5f5f5f]">{r.boardName}</td>
      <td className="max-w-[260px] truncate px-3 py-2">
        {indent ? (
          <span className="text-[#919191]">〃</span>
        ) : (
          <Link href={getAdminPostDetailHref(r.postId, DETAIL_FROM_MONITORING)} className="text-[#212121] hover:underline">
            {r.title ?? `(삭제된 글 #${r.postId})`}
          </Link>
        )}
      </td>
      <td className="px-3 py-2 text-right">{num(r.rawScore)}</td>
      <td className="px-3 py-2 text-right text-[#919191]">{num(r.baselineScore)}</td>
      <td className="px-3 py-2 text-right">{r.spikeRatio == null ? '신규' : `×${Number(r.spikeRatio).toFixed(1)}`}</td>
      <td className="px-3 py-2 text-right">{num(r.viewDelta)}</td>
      <td className="px-3 py-2 text-right">{num(r.likeDelta)}</td>
      <td className="px-3 py-2 text-right">{num(r.commentDelta)}</td>
    </tr>
  );
}

// 글 하나로 묶기 — 가장 최근 구간이 위. 선정된 적이 있으면 가장 좋은 순위를 배지로
function groupByPost(rows) {
  const map = new Map();
  rows.forEach((r) => {
    if (!map.has(r.postId)) map.set(r.postId, { postId: r.postId, title: r.title, boardName: r.boardName, intervals: [] });
    map.get(r.postId).intervals.push(r);
  });
  return [...map.values()].map((g) => {
    const trending = g.intervals.filter((r) => r.isTrending);
    return {
      ...g,
      latest: g.intervals[0],
      timesTrending: trending.length,
      bestRank: trending.length ? Math.min(...trending.map((r) => r.rankNo)) : null,
      maxScore: Math.max(...g.intervals.map((r) => Number(r.rawScore) || 0)),
      views: g.intervals.reduce((s, r) => s + (r.viewDelta || 0), 0),
      likes: g.intervals.reduce((s, r) => s + (r.likeDelta || 0), 0),
      comments: g.intervals.reduce((s, r) => s + (r.commentDelta || 0), 0),
    };
  });
}

export default function TrendingTable({ rows = [], isLoading, error, policy = null, grouped = false }) {
  const [open, setOpen] = useState(() => new Set());
  const groups = useMemo(() => (grouped ? groupByPost(rows) : []), [grouped, rows]);

  if (isLoading) return <p className="py-6 text-center text-[14px] text-[#919191]">불러오는 중...</p>;
  if (error) return <p className="py-6 text-center text-[14px] text-[#919191]">{error}</p>;
  if (!rows.length) {
    return (
      <p className="py-6 text-center text-[14px] text-[#919191]">
        최근 집계 행이 없습니다. 적재 컷(trending_min_delta_score) 미만인 조용한 구간은 행을 만들지 않습니다.
      </p>
    );
  }
  const toggle = (postId) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });

  return (
    <div className="overflow-x-auto rounded-[8px] border border-[#EEEEEE]">
      <table className="w-full min-w-[760px] text-[13px]">
        <thead className="bg-[#F7F8F9] text-left text-[#5f5f5f]">
          <tr>
            <th className="px-3 py-2 font-medium">{grouped ? '최근 구간' : '구간'}</th>
            <th className="px-3 py-2 font-medium">{grouped ? '선정' : '순위'}</th>
            <th className="px-3 py-2 font-medium">게시판</th>
            <th className="px-3 py-2 font-medium">글</th>
            <th className="px-3 py-2 text-right font-medium">{grouped ? '최고 점수' : '점수'}</th>
            <th className="px-3 py-2 text-right font-medium">{grouped ? '구간 수' : '평소'}</th>
            <th className="px-3 py-2 text-right font-medium">{grouped ? '' : '배수'}</th>
            <th className="px-3 py-2 text-right font-medium">조회+</th>
            <th className="px-3 py-2 text-right font-medium">좋아요+</th>
            <th className="px-3 py-2 text-right font-medium">댓글+</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F3F3F3]">
          {grouped
            ? groups.map((g) => <GroupRows key={g.postId} g={g} policy={policy} opened={open.has(g.postId)} onToggle={() => toggle(g.postId)} />)
            : rows.map((r) => <IntervalRow key={`${r.statHour}-${r.postId}`} r={r} policy={policy} />)}
        </tbody>
      </table>
      {policy && (
        <p className="border-t border-[#F3F3F3] px-3 py-2 text-[11px] text-[#919191]">
          선정 기준(지금 값): 점수 {policy.minScore} 이상 · 평소 대비 ×{policy.spikeRatio} 이상(평소 기록이 없는 신규 글은 면제) · 구간 안 {policy.topN}위 이내. 셋 다 통과해야 선정.
        </p>
      )}
    </div>
  );
}

function GroupRows({ g, policy, opened, onToggle }) {
  return (
    <>
      <tr className={g.timesTrending ? 'bg-[#FFF8E6]' : ''}>
        <td className="whitespace-nowrap px-3 py-2 text-[#5f5f5f]">
          <button type="button" onClick={onToggle} className="mr-1 text-[#919191]" aria-label={opened ? '접기' : '펼치기'}>
            {opened ? '▾' : '▸'}
          </button>
          {fmtHour(g.latest.statHour)}
        </td>
        <td className="px-3 py-2">
          {g.timesTrending ? (
            <span className="rounded-full bg-[#212121] px-2 py-[2px] text-[12px] text-white">
              최고 {g.bestRank}위 · {g.timesTrending}회
            </span>
          ) : (
            <span className="text-[11px] text-[#b3261e]">{reasonOf(g.latest, policy)}</span>
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-[#5f5f5f]">{g.boardName}</td>
        <td className="max-w-[260px] truncate px-3 py-2">
          <Link href={getAdminPostDetailHref(g.postId, DETAIL_FROM_MONITORING)} className="text-[#212121] hover:underline">
            {g.title ?? `(삭제된 글 #${g.postId})`}
          </Link>
        </td>
        <td className="px-3 py-2 text-right">{num(g.maxScore)}</td>
        <td className="px-3 py-2 text-right text-[#919191]">{g.intervals.length}</td>
        <td className="px-3 py-2 text-right" />
        <td className="px-3 py-2 text-right">{num(g.views)}</td>
        <td className="px-3 py-2 text-right">{num(g.likes)}</td>
        <td className="px-3 py-2 text-right">{num(g.comments)}</td>
      </tr>
      {opened && g.intervals.map((r) => <IntervalRow key={`${r.statHour}-${r.postId}`} r={r} policy={policy} indent />)}
    </>
  );
}
