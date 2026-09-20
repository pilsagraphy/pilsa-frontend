'use client';
import React, { useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import MemberListSection from './MemberListSection';
import PenaltyStatCard from './PenaltyStatCard';
import ReportSection from './ReportSection';
import useSanctionStore from '@/stores/useSanctionStore';
import { getAdminPostDetailHref } from '@/constants/adminPosts';
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

// 사유 줄들. 신고 사유와 처리 사유는 다른 것이다 — 신고는 '기타'로 들어와도 관리자는 '욕설'로 지울 수 있다.
// 기타면 적어 둔 내용을 괄호로 붙인다 (안 보여 주면 '기타'만 남아 무슨 일인지 알 수 없다).
function toReasonLines(report) {
  const withDetail = (label, detail) => (detail ? `${label} (${detail})` : label);
  const lines = [];
  if (report.reportId != null) {
    lines.push(`신고자: ${report.reporterName ?? '(탈퇴)'}`);
    lines.push(`신고 사유: ${withDetail(report.reasonLabel ?? '-', report.detail)}`);
  }
  if (report.actionState) {
    const what = report.actionState === 'blind' ? '블라인드' : '삭제';
    const who = report.isAuto ? '신고 누적 자동' : `관리자 ${report.actorName ?? '(탈퇴)'}`;
    lines.push(`${what} 사유: ${withDetail(report.actionReasonLabel ?? '-', report.actionDetail)}`);
    lines.push(`처리: ${who}`);
  }
  if (lines.length === 0) lines.push('미처리');
  return lines;
}

// 신고된 게시글 응답 → ReportSection 이 쓰는 row 모양
// 원문 링크의 글자는 열 너비 때문에 'Link' 하나뿐이라, 어느 글로 가는지는
// 서버가 주는 제목을 title(마우스오버) / linkLabel(보조기기) 로만 알릴 수 있다.
// 관리자 댓글 관리의 CommentRow 가 '바로가기' 링크를 같은 이유로 같게 처리한다.
// 신고 없이 관리자가 바로 조치한 건은 reportId 가 없다(moderation_log 에서 온다).
// 그래도 목록의 key 는 있어야 하니 대상과 시각으로 만든다.
const rowKey = (report, targetId) => report.reportId ?? `m-${targetId}-${report.resolvedAt}`;

function toPostRow(report) {
  return {
    reportId: rowKey(report, report.postId),
    board: report.boardName,
    reason: toReasonLines(report),
    // 관리자 상세로 보낸다 — 회원 화면은 삭제·블라인드된 글을 안 보여 줘서 '원문 보기'가 빈 화면으로 끝났다
    link: getAdminPostDetailHref(report.postId),
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
  // 관리자 상세는 모든 게시판에 댓글 칸이 있어 앵커를 늘 걸 수 있다
  const postHref = getAdminPostDetailHref(report.postId);
  const link = postHref ? `${postHref}#${getCommentAnchorId(report.commentId)}` : null;
  return {
    reportId: rowKey(report, report.commentId),
    board: report.boardName,
    reason: toReasonLines(report),
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
  // PC 에서 본문 폭이 모자라면 오른쪽 상세가 잘린다(사이드바가 240px 을 가져간다).
  // 목록을 접어 자리를 내주고, 그래도 모자라면 옆으로 밀어 볼 수 있게 한다
  const [listCollapsed, setListCollapsed] = useState(false);

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
    <section className="mx-auto flex w-full max-w-[980px] flex-col gap-[24px] bg-white p-4 font-['Pretendard',sans-serif] md:p-8">
      {/* 화면 정체성 */}
      <h2 className="text-[24px] font-medium tracking-[-0.48px] text-[#212121]">제재 회원 관리</h2>

      {/* 좁은 화면에서는 목록 위 · 상세 아래로 쌓는다 (나란히 두면 오른쪽이 화면 밖으로 나간다).
          PC 는 나란히 두되, 폭이 모자라면 옆으로 스크롤한다 (overflow-x-auto) */}
      <div className="flex flex-col gap-[20px] lg:flex-row lg:gap-[28px] lg:overflow-x-auto lg:pb-[8px]">
        {/* 좌측: 회원 목록. PC 에서는 접을 수 있다 */}
        {listCollapsed ? (
          <button
            type="button"
            onClick={() => setListCollapsed(false)}
            title="목록 펼치기"
            aria-label="회원 목록 펼치기"
            className="hidden h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[6px] border border-[#dedede] text-[#454545] hover:bg-[#f6f6f6] lg:flex"
          >
            <PanelLeftOpen size={18} />
          </button>
        ) : null}
        <div className={listCollapsed ? 'lg:hidden' : 'contents'}>
          <MemberListSection
            selectedId={selectedId}
            onSelect={setSelectedId}
            collapseButton={
              <button
                type="button"
                onClick={() => setListCollapsed(true)}
                title="목록 접기"
                aria-label="회원 목록 접기"
                className="hidden size-[24px] place-content-center text-[#919191] hover:text-[#212121] lg:grid"
              >
                <PanelLeftClose size={18} />
              </button>
            }
          />
        </div>

        {/* 우측: 선택 회원 상세 (넓은 화면에서만 디자인 폭으로 고정) */}
        <div className="w-full min-w-0 lg:w-[618px] lg:shrink-0">
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
                <div className="mt-[20px] grid grid-cols-2 gap-[8px] sm:mt-[24px] sm:grid-cols-4 sm:gap-[12px]">
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
              <div className="mt-[20px] flex flex-col gap-[20px] rounded-[12px] border border-[#dedede] p-[12px] shadow-[0px_1px_6px_0px_rgba(0,0,0,0.15)] md:mt-[24px] md:gap-[28px] md:rounded-[15px] md:p-[18px] md:shadow-[0px_1px_8.3px_0px_rgba(0,0,0,0.25)]">
                <ReportSection
                  title="신고·처리 게시글"
                  reports={selectedPosts.data.map(toPostRow)}
                  isLoading={selectedPosts.isLoading}
                  error={selectedPosts.error}
                />
                <ReportSection
                  title="신고·처리 댓글"
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
