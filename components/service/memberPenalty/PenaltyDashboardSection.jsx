'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import MemberListSection from './MemberListSection';
import PenaltyStatCard from './PenaltyStatCard';
import ReportSection from './ReportSection';
import ModerationLegend from '@/components/shared/admin/ModerationLegend';
import useSanctionStore from '@/stores/useSanctionStore';
import { DETAIL_FROM_PENALTY, getAdminPostDetailHref } from '@/constants/adminPosts';
import { REPORT_TARGET_COMMENT, REPORT_TARGET_POST } from '@/constants/adminReports';
import { MODERATION_KINDS } from '@/constants/moderation';
import { ROUTES } from '@/constants/routes';
import { getCommentAnchorId } from '@/lib/utils';

// tag(permanent|temporary|caution|history|none) → 현재 상태 문구
// 응답에 banStatus 도 함께 오지만 보지 않는다 — tag 를 백엔드가 항상 현재 제재 상태에 맞춰
// 갱신해주기로 했다. 그래서 제재 해제처럼 상태를 바꾸는 조치를 붙일 때도 프론트에서 계산하지 말고
// 목록/상세를 다시 GET 해서 갱신된 tag 를 받아오면 된다.
// history = 제재는 없지만 신고·조치 로그가 있는 회원 (복원된 사람 포함), none = 그것도 없음
const statusText = (tag) => {
  if (tag === 'caution') return '주의';
  if (tag === 'history' || tag === 'none') return '제재 없음';
  return '정지';
};

// ISO 일시 → 'YY.MM.DD'
function formatDate(iso) {
  if (!iso) return '';
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${year.slice(2)}.${month}.${day}`;
}

// ISO 일시 → 'HH:mm' — 같은 날 여러 사건(블라인드 → 삭제)이 있어 시각을 따로 칸에 둔다
const formatTime = (iso) => (iso ? iso.slice(11, 16) : '');

// 회원 상태 줄: 주의 | 영구 정지 | 정지 (기간) | 제재 없음(로그만)
function toBanText(detail) {
  if (!detail) return '';
  if (detail.tag === 'caution') return '주의';
  if (detail.tag === 'history' || detail.tag === 'none') return '제재 없음';
  if (detail.tag === 'permanent' || !detail.bannedUntil) return '영구 정지';
  return `정지 (${formatDate(detail.banStartedAt)} - ${formatDate(detail.bannedUntil)})`;
}

// 대상 표시 상태(normal/blind/deleted) → 한글
const STATE_LABEL = { normal: '정상', blind: '블라인드', deleted: '삭제' };

// 신고 상태 → 한글 (사건 행의 '상태' 칸)
const REPORT_STATUS_LABEL = { pending: '접수', resolved: '처리 완료', rejected: '반려' };

// 조치 종류 이름 — 신고 관리 칩 · (i) 범례와 같은 말 (constants/moderation)
//   블라인드: 자동이면 '신고 누적', 신고가 있었으면 '신고에 따른 관리자 조치', 없었으면 '관리자 직접 조치'
//   삭제    : 신고가 있었으면 '신고 누적으로 인한 관리자 조치', 없었으면 '관리자 직접 조치'
function actionKind(entry) {
  if (entry.eventType === 'blind') {
    if (entry.isAuto) return MODERATION_KINDS.AUTO_BLIND;
    return entry.reported ? MODERATION_KINDS.REPORTED_BLIND : MODERATION_KINDS.ADMIN_BLIND;
  }
  if (entry.eventType === 'delete') {
    return entry.reported ? MODERATION_KINDS.REPORTED_DELETE : MODERATION_KINDS.ADMIN_DELETE;
  }
  return MODERATION_KINDS.RESTORE;
}

// 사건 한 건(서버 MemberHistoryEntryResponse) → 내역 줄들 + 상태 (PM 형식, 2026-09-27):
//   조치자 : 박건희 / 조치내용 : 관리자 직접 조치 (블라인드) / 조치사유 : 허위사실 · 사기 (기타면 적은 내용을 괄호에)
//   신고는 신고자 / 신고내용 / 신고사유 로 같은 꼴
function toEvent(entry) {
  if (entry.eventType === 'report') {
    return {
      lines: [
        { label: '신고자', value: entry.reporterName ?? '(탈퇴)' },
        { label: '신고내용', value: '회원 신고' },
        { label: '신고사유', value: entry.reasonLabel ?? '-', detail: entry.detail },
      ],
      status: REPORT_STATUS_LABEL[entry.reportStatus] ?? entry.reportStatus,
    };
  }
  const kind = actionKind(entry);
  const lines = [
    { label: '조치자', value: entry.isAuto ? '자동 (신고 누적)' : (entry.actorName ?? '(탈퇴)') },
    { label: '조치내용', value: kind.label },
  ];
  // 복원은 사유를 받지 않는다
  if (entry.eventType !== 'restore') {
    lines.push({ label: '조치사유', value: entry.reasonLabel ?? '-', detail: entry.detail });
  }
  return { lines, status: { blind: '블라인드', delete: '삭제', restore: '복원' }[entry.eventType] ?? '' };
}

// 서버 로그(최신순, 사건 단위) → 글/댓글 묶음 목록.
// 번호는 묶음(글/댓글 하나) 단위로 오래된 것부터 1, 2, … 를 붙이고, 묶음 안의 사건은 시간순으로 진행순번 1, 2, … 가 된다.
// 원문 링크는 관리자 상세로 보낸다 — 회원 화면은 삭제·블라인드된 글을 안 보여 줘서 '원문 보기'가 빈 화면으로 끝났다.
// 링크 글자는 열 너비 때문에 '원문' 하나뿐이라, 어느 글로 가는지는 title(마우스오버) / linkLabel(보조기기) 로 알린다.
// 복원·삭제는 여기서 하지 않고 '신고 관리' 링크로 건너가서 한다 (PM, 2026-09-27).
function toGroups(entries, targetType) {
  const isComment = targetType === REPORT_TARGET_COMMENT;
  const byTarget = new Map();
  // 서버는 최신순으로 주므로 뒤집어 오래된 것부터 담는다 → Map 삽입 순서가 곧 묶음 번호 순서
  [...entries].reverse().forEach((entry) => {
    const targetId = isComment ? entry.commentId : entry.postId;
    if (!byTarget.has(targetId)) {
      const postHref = getAdminPostDetailHref(entry.postId, DETAIL_FROM_PENALTY);
      // 관리자 상세는 모든 게시판에 댓글 칸이 있어 앵커를 늘 걸 수 있다. 쿼리(from)는 해시보다 앞에 와야 한다
      const link = isComment && postHref ? `${postHref}#${getCommentAnchorId(entry.commentId)}` : postHref;
      byTarget.set(targetId, {
        key: `${targetType}-${targetId}`,
        targetType,
        targetId,
        board: entry.boardName,
        link,
        targetTitle: entry.title,
        linkLabel: entry.title ? `${isComment ? '원글' : '게시글'} 보기: ${entry.title}` : undefined,
        // 신고 관리에 지금 보이는 대상(반려되지 않은 신고 행이 있음)만 링크를 건다 — 복원돼 반려로 끝난 글은 거기 가도 없다 (PM, 10/10)
        reportsLink: entry.listedInReports ? ROUTES.ADMIN_REPORTS_TAB(targetType) : null,
        state: entry.state,
        stateLabel: STATE_LABEL[entry.state] ?? entry.state,
        events: [],
      });
    }
    const group = byTarget.get(targetId);
    group.events.push({
      key: entry.actionId != null ? `a-${entry.actionId}` : `r-${entry.reportId}`,
      sub: group.events.length + 1,
      date: formatDate(entry.eventAt),
      time: formatTime(entry.eventAt),
      ...toEvent(entry),
    });
  });
  return [...byTarget.values()].map((group, index) => ({ ...group, number: index + 1 }));
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

  // ?userId= 로 들어오면 그 회원을 먼저 고른다 — 신고 관리의 "원글 작성자 제재 회원 보기" 링크가 쓴다 (2026-09-27).
  // useSearchParams 는 정적 페이지에서 Suspense 경계를 요구해 빌드가 깨질 수 있어 마운트 뒤 window 에서 읽는다
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    const requested = Number(new URLSearchParams(window.location.search).get('userId')) || null;
    if (requested) setSelectedId(requested);
  }, []);
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

  const postGroups = useMemo(() => toGroups(selectedPosts.data, REPORT_TARGET_POST), [selectedPosts.data]);
  const commentGroups = useMemo(
    () => toGroups(selectedComments.data, REPORT_TARGET_COMMENT),
    [selectedComments.data],
  );

  return (
    <section className="mx-auto flex w-full max-w-none flex-col gap-[24px] bg-white px-4 py-4 font-['Pretendard',sans-serif] sm:px-6 sm:py-7 md:p-10">
      {/* 화면 정체성. 제목 옆 (i) 는 조치 종류 설명 — 로그의 '조치내용' 이 이 이름들을 쓴다 */}
      <h2 className="flex items-center gap-[8px] text-[24px] font-medium tracking-[-0.48px] text-[#212121]">
        제재 회원 관리
        <ModerationLegend />
      </h2>

      {/* 좁은 화면에서는 목록 위 · 상세 아래로 쌓는다 (나란히 두면 오른쪽이 화면 밖으로 나간다).
          PC 는 나란히 두되, 폭이 모자라면 옆으로 스크롤한다 (overflow-x-auto) */}
      <div className="flex flex-col gap-[20px] xl:flex-row xl:gap-[28px] xl:overflow-x-auto xl:pb-[8px]">
        {/* 좌측: 회원 목록. PC 에서는 접을 수 있다 */}
        {listCollapsed ? (
          <button
            type="button"
            onClick={() => setListCollapsed(false)}
            title="목록 펼치기"
            aria-label="회원 목록 펼치기"
            className="hidden h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[6px] border border-[#dedede] text-[#454545] hover:bg-[#f6f6f6] xl:flex"
          >
            <PanelLeftOpen size={18} />
          </button>
        ) : null}
        <div className={listCollapsed ? 'xl:hidden' : 'contents'}>
          <MemberListSection
            selectedId={selectedId}
            onSelect={setSelectedId}
            collapseButton={
              <button
                type="button"
                onClick={() => setListCollapsed(true)}
                title="목록 접기"
                aria-label="회원 목록 접기"
                className="hidden size-[24px] place-content-center text-[#919191] hover:text-[#212121] xl:grid"
              >
                <PanelLeftClose size={18} />
              </button>
            }
          />
        </div>

        {/* 우측: 선택 회원 상세 (넓은 화면에서만 디자인 폭으로 고정) */}
        <div className="w-full min-w-0 xl:w-[618px] xl:shrink-0">
          {selectedUser ? (
            <div className="flex flex-col">
              {/* 회원명 (아이디) + 회색 가로선 */}
              <div className="border-b border-[#b9b9b9] pb-[18px]">
                <p className="text-[24px] font-medium tracking-[-0.48px] text-[#212121]">
                  {selectedUser.name} ({selectedUser.loginId})
                </p>
              </div>

              {/* 회원 상태 + 회색 가로선 */}
              <div className="flex items-center justify-between border-b border-[#b9b9b9] py-[12px] pr-[14px]">
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
                  groups={postGroups}
                  isLoading={selectedPosts.isLoading}
                  error={selectedPosts.error}
                />
                <ReportSection
                  title="신고·처리 댓글"
                  groups={commentGroups}
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
