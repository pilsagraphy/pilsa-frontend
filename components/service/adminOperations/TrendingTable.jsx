'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

// 급상승 집계 표 — stats_post_hourly 최근 행. 선정(is_trending)된 행은 진하게.
const fmtHour = (iso) => (iso ? `${String(iso).slice(5, 10).replace('-', '/')} ${String(iso).slice(11, 13)}시` : '');
const num = (v) => (v == null ? '-' : Number(v).toLocaleString('ko-KR'));

export default function TrendingTable({ rows = [], isLoading, error }) {
  if (isLoading) return <p className="py-6 text-center text-[14px] text-[#919191]">불러오는 중...</p>;
  if (error) return <p className="py-6 text-center text-[14px] text-[#919191]">{error}</p>;
  if (!rows.length) {
    return (
      <p className="py-6 text-center text-[14px] text-[#919191]">
        최근 집계 행이 없습니다. 적재 컷(trending_min_delta_score) 미만인 조용한 구간은 행을 만들지 않습니다.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-[8px] border border-[#EEEEEE]">
      <table className="w-full min-w-[720px] text-[13px]">
        <thead className="bg-[#F7F8F9] text-left text-[#5f5f5f]">
          <tr>
            <th className="px-3 py-2 font-medium">구간</th>
            <th className="px-3 py-2 font-medium">순위</th>
            <th className="px-3 py-2 font-medium">게시판</th>
            <th className="px-3 py-2 font-medium">글</th>
            <th className="px-3 py-2 text-right font-medium">점수</th>
            <th className="px-3 py-2 text-right font-medium">평소</th>
            <th className="px-3 py-2 text-right font-medium">배수</th>
            <th className="px-3 py-2 text-right font-medium">조회+</th>
            <th className="px-3 py-2 text-right font-medium">좋아요+</th>
            <th className="px-3 py-2 text-right font-medium">댓글+</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F3F3F3]">
          {rows.map((r) => (
            <tr key={`${r.statHour}-${r.postId}`} className={r.isTrending ? 'bg-[#FFF8E6]' : ''}>
              <td className="whitespace-nowrap px-3 py-2 text-[#5f5f5f]">{fmtHour(r.statHour)}</td>
              <td className="px-3 py-2">
                {r.isTrending ? (
                  <span className="rounded-full bg-[#212121] px-2 py-[2px] text-[12px] text-white">{r.rankNo}위</span>
                ) : (
                  <span className="text-[#919191]">{r.rankNo ?? '-'}</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-[#5f5f5f]">{r.boardName}</td>
              <td className="max-w-[260px] truncate px-3 py-2">
                <Link href={ROUTES.ADMIN_POST_DETAIL(r.postId)} className="text-[#212121] hover:underline">
                  {r.title ?? `(삭제된 글 #${r.postId})`}
                </Link>
              </td>
              <td className="px-3 py-2 text-right">{num(r.rawScore)}</td>
              <td className="px-3 py-2 text-right text-[#919191]">{num(r.baselineScore)}</td>
              <td className="px-3 py-2 text-right">{r.spikeRatio == null ? '신규' : `×${Number(r.spikeRatio).toFixed(1)}`}</td>
              <td className="px-3 py-2 text-right">{num(r.viewDelta)}</td>
              <td className="px-3 py-2 text-right">{num(r.likeDelta)}</td>
              <td className="px-3 py-2 text-right">{num(r.commentDelta)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
