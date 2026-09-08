'use client';
import React, { useEffect, useState } from 'react';
import MemberListSection from './MemberListSection';
import PenaltyStatCard from './PenaltyStatCard';
import ReportSection from './ReportSection';
import useSanctionStore from '@/stores/useSanctionStore';
import { getPostDetailHref, boardHasComments } from '@/constants/adminPosts';
import { getCommentAnchorId } from '@/lib/utils';

// tag(permanent|temporary|caution) → 현재 상태 문구
const statusText = (tag) => (tag === 'caution' ? '주의' : '정지');

// ISO 일시 → 'YY.MM.DD'
function formatDate(iso) {
  if (!iso) return '';
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${year.slice(2)}.${month}.${day}`;
}

// 회원 상태 줄: 주의 | 영구 정지 | 정지 (기간)
function toBanText(detail) {
  if (!detail) return '';
  if (detail.tag === 'caution') return '주의';
  if (detail.tag === 'permanent' || !detail.bannedUntil) return '영구 정지';
  return `정지 (${formatDate(detail.banStartedAt)} - ${formatDate(detail.bannedUntil)})`;
}

// 대상 표시 상태(normal/blind/deleted) → 한글
const STATE_LABEL = { normal: '정상', blind: '블라인드', deleted: '삭제' };

// 신고된 게시글 응답 → ReportSection 이 쓰는 row 모양
function toPostRow(report) {
  return {
    reportId: report.reportId,
    board: report.boardName,
    reason: report.reasonLabel,
    link: getPostDetailHref(report.boardName, report.postId),
    status: STATE_LABEL[report.state] ?? report.state,
    date: formatDate(report.resolvedAt ?? report.createdAt),
  };
}

// 신고된 댓글 응답 → ReportSection row (댓글은 소속 게시글 + 댓글 앵커로 이동)
function toCommentRow(report) {
  const postHref = getPostDetailHref(report.boardName, report.postId);
  const link =
    postHref && boardHasComments(report.boardName)
      ? `${postHref}#${getCommentAnchorId(report.commentId)}`
      : postHref;
  return {
    reportId: report.reportId,
    board: report.boardName,
    reason: report.reasonLabel,
    link,
    status: STATE_LABEL[report.state] ?? report.state,
    date: formatDate(report.resolvedAt ?? report.createdAt),
  };
}

// 합치는 곳: 제재 회원 관리 화면
// 좌측에 회원 목록, 우측에 선택 회원 상세를 보여준다.
export default function PenaltyDashboardSection() {
  const users = useSanctionStore((s) => s.users);
  const detail = useSanctionStore((s) => s.detail);
  const reportedPosts = useSanctionStore((s) => s.reportedPosts);
  const reportedComments = useSanctionStore((s) => s.reportedComments);
  const fetchSanctionedUserDetail = useSanctionStore((s) => s.fetchSanctionedUserDetail);
  const fetchSanctionedUserReportedPosts = useSanctionStore(
    (s) => s.fetchSanctionedUserReportedPosts,
  );
  const fetchSanctionedUserReportedComments = useSanctionStore(
    (s) => s.fetchSanctionedUserReportedComments,
  );

  const [selectedId, setSelectedId] = useState(null);

  // 목록(MemberListSection이 받아온다)이 채워지면 첫 회원을 기본 선택한다.
  useEffect(() => {
    if (selectedId == null && users.data.length > 0) {
      setSelectedId(users.data[0].userId);
    }
  }, [selectedId, users.data]);

  // 선택한 회원의 상세 + 신고 게시글 + 신고 댓글을 받아온다.
  useEffect(() => {
    if (selectedId == null) return;
    fetchSanctionedUserDetail(selectedId);
    fetchSanctionedUserReportedPosts(selectedId);
    fetchSanctionedUserReportedComments(selectedId);
  }, [
    selectedId,
    fetchSanctionedUserDetail,
    fetchSanctionedUserReportedPosts,
    fetchSanctionedUserReportedComments,
  ]);

  // 헤더(이름/아이디)는 목록 응답에서 가져온다 (상세 응답엔 없다).
  const selectedUser = users.data.find((u) => u.userId === selectedId) ?? null;

  return (
    <section className="mx-auto flex w-full max-w-[980px] flex-col gap-[24px] bg-white p-8 font-['Pretendard',sans-serif]">
      {/* 화면 정체성 */}
      <h2 className="text-[24px] font-medium tracking-[-0.48px] text-[#212121]">제재 회원 관리</h2>

      <div className="flex gap-[28px]">
        {/* 좌측: 회원 목록 */}
        <MemberListSection selectedId={selectedId} onSelect={setSelectedId} />

        {/* 우측: 선택 회원 상세 (디자인 폭에 맞춰 고정) */}
        <div className="w-[618px] shrink-0">
          {selectedUser ? (
            <div className="flex flex-col">
              {/* 회원명 (아이디) + 회색 가로선 */}
              <div className="border-b border-[#b9b9b9] pb-[18px]">
                <p className="text-[24px] font-medium tracking-[-0.48px] text-[#212121]">
                  {selectedUser.name} ({selectedUser.loginId})
                </p>
              </div>

              {/* 회원 상태 + 회색 가로선 */}
              <div className="flex items-center justify-between border-b border-[#b9b9b9] py-[12px]">
                <span className="text-[14px] font-medium tracking-[-0.28px] text-[#b9b9b9]">
                  회원 상태
                </span>
                <span className="text-[14px] tracking-[-0.28px] text-[#ae0000]">
                  {detail.isLoading
                    ? '불러오는 중…'
                    : detail.error
                      ? detail.error
                      : toBanText(detail.data)}
                </span>
              </div>

              {/* 통계 카드 4개: 로딩 / 에러 / 데이터 있음 처리 */}
              {detail.isLoading ? (
                <div className="mt-[24px] flex h-[87px] items-center justify-center text-[14px] tracking-[-0.28px] text-[#919191]">
                  불러오는 중…
                </div>
              ) : detail.error ? (
                <div className="mt-[24px] flex h-[87px] items-center justify-center text-[14px] tracking-[-0.28px] text-[#ae0000]">
                  {detail.error}
                </div>
              ) : detail.data ? (
                <div className="mt-[24px] flex justify-between">
                  <PenaltyStatCard
                    value={`${detail.data.cautionRemainder}/10`}
                    label="누적 주의"
                  />
                  <PenaltyStatCard value={`${detail.data.warningCount}/3`} label="누적 경고" />
                  <PenaltyStatCard value={statusText(detail.data.tag)} label="현재 상태" />
                  <PenaltyStatCard value={detail.data.reportDeletedCount} label="신고 삭제 수" />
                </div>
              ) : null}

              {/* 길쭉한 회색 박스 안에 신고 게시글 / 신고 댓글 */}
              <div className="mt-[24px] flex flex-col gap-[28px] rounded-[15px] border border-[#dedede] p-[18px] shadow-[0px_1px_8.3px_0px_rgba(0,0,0,0.25)]">
                <ReportSection
                  title="신고 게시글"
                  reports={reportedPosts.data.map(toPostRow)}
                  isLoading={reportedPosts.isLoading}
                  error={reportedPosts.error}
                />
                <ReportSection
                  title="신고 댓글"
                  reports={reportedComments.data.map(toCommentRow)}
                  isLoading={reportedComments.isLoading}
                  error={reportedComments.error}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-[#919191]">
              {users.isLoading ? '불러오는 중…' : users.error ? users.error : '회원을 선택하세요.'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
