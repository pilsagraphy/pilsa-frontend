'use client';
import React, { useEffect, useState } from 'react';
import MemberListSection from './MemberListSection';
import PenaltyStatCard from './PenaltyStatCard';
import ReportSection from './ReportSection';
import useSanctionStore from '@/stores/useSanctionStore';
import { getPostDetailHref, boardHasComments } from '@/constants/adminPosts';
import { getCommentAnchorId } from '@/lib/utils';

// tag(permanent|temporary|caution) → 현재 상태 문구
// 응답에 banStatus 도 함께 오지만 보지 않는다 — tag 를 백엔드가 항상 현재 제재 상태에 맞춰
// 갱신해주기로 했다. 그래서 제재 해제처럼 상태를 바꾸는 조치를 붙일 때도 프론트에서 계산하지 말고
// 목록/상세를 다시 GET 해서 갱신된 tag 를 받아오면 된다.
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
// 원문 링크의 글자는 열 너비 때문에 'Link' 하나뿐이라, 어느 글로 가는지는
// 서버가 주는 제목을 title(마우스오버) / linkLabel(보조기기) 로만 알릴 수 있다.
// 관리자 댓글 관리의 CommentRow 가 '바로가기' 링크를 같은 이유로 같게 처리한다.
function toPostRow(report) {
  return {
    reportId: report.reportId,
    board: report.boardName,
    reason: report.reasonLabel,
    link: getPostDetailHref(report.boardId, report.postId),
    targetTitle: report.title,
    linkLabel: report.title ? `게시글 보기: ${report.title}` : undefined,
    status: STATE_LABEL[report.state] ?? report.state,
    // 아직 처리되지 않은 신고는 처리일이 없다. 신고 등록일(createdAt)을 대신 쓰면
    // 처리된 것처럼 보이므로 '미처리'로 표시한다. 정렬은 원본 ISO 값으로 한다.
    resolvedAt: report.resolvedAt ?? null,
    date: report.resolvedAt ? formatDate(report.resolvedAt) : '미처리',
  };
}

// 신고된 댓글 응답 → ReportSection row (댓글은 소속 게시글 + 댓글 앵커로 이동)
// 댓글엔 제목이 없어 이동할 원글의 제목(postTitle)을 대신 알린다.
function toCommentRow(report) {
  const postHref = getPostDetailHref(report.boardId, report.postId);
  const link =
    postHref && boardHasComments(report.boardName)
      ? `${postHref}#${getCommentAnchorId(report.commentId)}`
      : postHref;
  return {
    reportId: report.reportId,
    board: report.boardName,
    reason: report.reasonLabel,
    link,
    targetTitle: report.postTitle,
    linkLabel: report.postTitle ? `원글 보기: ${report.postTitle}` : undefined,
    status: STATE_LABEL[report.state] ?? report.state,
    resolvedAt: report.resolvedAt ?? null,
    date: report.resolvedAt ? formatDate(report.resolvedAt) : '미처리',
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

  // 회원을 막 바꾼 프레임에는 스토어에 아직 이전 회원의 데이터가 들어 있다
  // (fetch 는 useEffect 에서 시작해 페인트보다 늦다). 새 회원 이름 아래에 이전 회원의
  // 통계가 잠깐 그려지지 않도록, 담긴 userId 가 다르면 로딩으로 취급한다.
  const forSelected = (slice, emptyData) =>
    slice.userId === selectedId ? slice : { isLoading: true, data: emptyData, error: null };

  const selectedDetail = forSelected(detail, null);
  const selectedPosts = forSelected(reportedPosts, []);
  const selectedComments = forSelected(reportedComments, []);

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
                  {selectedDetail.isLoading
                    ? '불러오는 중…'
                    : selectedDetail.error
                      ? selectedDetail.error
                      : toBanText(selectedDetail.data)}
                </span>
              </div>

              {/* 통계 카드 4개: 로딩 / 에러 / 데이터 있음 처리 */}
              {selectedDetail.isLoading ? (
                <div className="mt-[24px] flex h-[87px] items-center justify-center text-[14px] tracking-[-0.28px] text-[#919191]">
                  불러오는 중…
                </div>
              ) : selectedDetail.error ? (
                <div className="mt-[24px] flex h-[87px] items-center justify-center text-[14px] tracking-[-0.28px] text-[#ae0000]">
                  {selectedDetail.error}
                </div>
              ) : selectedDetail.data ? (
                <div className="mt-[24px] flex justify-between">
                  <PenaltyStatCard
                    value={`${selectedDetail.data.cautionRemainder}/10`}
                    label="누적 주의"
                  />
                  <PenaltyStatCard
                    value={`${selectedDetail.data.warningCount}/3`}
                    label="누적 경고"
                  />
                  <PenaltyStatCard value={statusText(selectedDetail.data.tag)} label="현재 상태" />
                  <PenaltyStatCard
                    value={selectedDetail.data.reportDeletedCount}
                    label="신고 삭제 수"
                  />
                </div>
              ) : null}

              {/* 길쭉한 회색 박스 안에 신고 게시글 / 신고 댓글 */}
              <div className="mt-[24px] flex flex-col gap-[28px] rounded-[15px] border border-[#dedede] p-[18px] shadow-[0px_1px_8.3px_0px_rgba(0,0,0,0.25)]">
                <ReportSection
                  title="신고 게시글"
                  reports={selectedPosts.data.map(toPostRow)}
                  isLoading={selectedPosts.isLoading}
                  error={selectedPosts.error}
                />
                <ReportSection
                  title="신고 댓글"
                  reports={selectedComments.data.map(toCommentRow)}
                  isLoading={selectedComments.isLoading}
                  error={selectedComments.error}
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
