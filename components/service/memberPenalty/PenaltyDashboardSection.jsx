'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import MemberListSection from './MemberListSection';
import PenaltyStatCard from './PenaltyStatCard';
import ReportSection from './ReportSection';
import ConfirmModal from '@/components/common/ConfirmModal';
import AlertModal from '@/components/common/AlertModal';
import useSanctionStore from '@/stores/useSanctionStore';
import { restoreReportTargets } from '@/apis/admin/reports';
import { getErrorMessage } from '@/apis/auth';
import { DETAIL_FROM_PENALTY, getAdminPostDetailHref } from '@/constants/adminPosts';
import { REPORT_TARGET_COMMENT, REPORT_TARGET_POST } from '@/constants/adminReports';
import { getCommentAnchorId } from '@/lib/utils';
import { toast } from '@/lib/toast';

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

// ISO 일시 → 'YY.MM.DD HH:mm' — 같은 날 여러 사건(블라인드 → 삭제)이 있어 시각까지 보여 준다
function formatDateTime(iso) {
  if (!iso) return '';
  return `${formatDate(iso)} ${iso.slice(11, 16)}`;
}

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

// 사건 한 건(서버 MemberHistoryEntryResponse) → 사건 행 { label, value, detail, status }
// 무슨 일이 있었는지를 라벨로 밝힌다 (PM 요청, 2026-09-27):
//   신고 / 자동 블라인드 / 관리자 블라인드 조치 / 관리자 삭제 조치 / 관리자 즉시 삭제 조치(블라인드 없이 바로) / 관리자 복원
function toEvent(entry) {
  const who = entry.isAuto ? '자동' : (entry.actorName ?? '(탈퇴)');
  const reason = entry.reasonLabel ?? '-';
  switch (entry.eventType) {
    case 'report':
      return {
        label: '신고',
        value: `${entry.reporterName ?? '(탈퇴)'} · ${reason}`,
        detail: entry.detail,
        status: REPORT_STATUS_LABEL[entry.reportStatus] ?? entry.reportStatus,
      };
    case 'blind':
      return {
        label: entry.isAuto ? '자동 블라인드' : '관리자 블라인드 조치',
        value: `${who} · ${reason}`,
        detail: entry.detail,
        status: '블라인드',
      };
    case 'delete':
      return {
        label: entry.isDirect ? '관리자 즉시 삭제 조치' : '관리자 삭제 조치',
        value: `${who} · ${reason}`,
        detail: entry.detail,
        status: '삭제',
      };
    case 'restore':
      return { label: '관리자 복원', value: who, detail: entry.detail, status: '복원' };
    default:
      return { label: entry.eventType, value: '', status: '' };
  }
}

// 서버 로그(최신순, 사건 단위) → 글/댓글 묶음 목록.
// 번호는 묶음(글/댓글 하나) 단위로 오래된 것부터 1, 2, … 를 붙이고, 묶음 안의 사건은 시간순으로 1-1, 1-2, … 가 된다.
// 원문 링크는 관리자 상세로 보낸다 — 회원 화면은 삭제·블라인드된 글을 안 보여 줘서 '원문 보기'가 빈 화면으로 끝났다.
// 링크 글자는 열 너비 때문에 '원문' 하나뿐이라, 어느 글로 가는지는 title(마우스오버) / linkLabel(보조기기) 로 알린다.
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
        state: entry.state,
        stateLabel: STATE_LABEL[entry.state] ?? entry.state,
        // 지금 블라인드·삭제 상태면 되돌릴 수 있다 (이미 처리가 끝난 삭제도)
        canRestore: entry.state === 'blind' || entry.state === 'deleted',
        events: [],
      });
    }
    const group = byTarget.get(targetId);
    group.events.push({
      key: entry.actionId != null ? `a-${entry.actionId}` : `r-${entry.reportId}`,
      sub: group.events.length + 1,
      date: formatDateTime(entry.eventAt),
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
  const fetchSanctionedUsers = useSanctionStore((s) => s.fetchSanctionedUsers);
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

  // ── 복원 ──────────────────────────────────────────────────────────────
  // 신고 관리와 같은 API(select-restore)로 되돌린다. 응답만 보고 화면을 고치지 않고 상세·로그·목록을 다시 받아온다 —
  // 주의 점수 회수로 tag 가 바뀌어 회원이 '이력'으로 내려갈 수 있고, 그건 서버가 정한다.
  const [restoreTarget, setRestoreTarget] = useState(null); // 확인 모달에 띄울 묶음
  const [restoring, setRestoring] = useState(false);
  const [alertState, setAlertState] = useState(null); // { title, description }

  const reloadSelected = () => {
    fetchSanctionedUsers();
    if (selectedId == null) return;
    fetchSanctionedUserDetail(selectedId);
    fetchSanctionedUserReportedPosts(selectedId);
    fetchSanctionedUserReportedComments(selectedId);
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTarget || restoring) return;
    const { targetType, targetId } = restoreTarget;
    const label = targetType === REPORT_TARGET_COMMENT ? '댓글' : '게시글';
    setRestoring(true);
    try {
      const data = await restoreReportTargets({ targetType, targetIds: [targetId] });
      const failures = data?.failures ?? [];
      if (failures.length === 0) {
        toast.success(`${label}을 복원했습니다.`);
      } else {
        // 댓글은 원 게시글이 공개 상태여야 복원된다 — 서버 문구를 그대로 보여 준다
        setAlertState({
          title: `${label}을 복원하지 못했습니다.`,
          description: [...new Set(failures.map((f) => f.message))].join('\n'),
        });
      }
      reloadSelected();
    } catch (err) {
      setAlertState({
        title: `${label}을 복원하지 못했습니다.`,
        description: getErrorMessage(err, '잠시 후 다시 시도해 주세요.'),
      });
    } finally {
      setRestoring(false);
      setRestoreTarget(null);
    }
  };

  const restoreTitle = restoreTarget
    ? `${restoreTarget.targetType === REPORT_TARGET_COMMENT ? '댓글' : '게시글'}을 복원할까요?\n${
        restoreTarget.state === 'deleted' ? '삭제가 취소되고 부과된 주의 점수도 회수됩니다.' : '블라인드가 해제됩니다.'
      }`
    : '';

  return (
    <section className="mx-auto flex w-full max-w-none flex-col gap-[24px] bg-white px-4 py-4 font-['Pretendard',sans-serif] sm:px-6 sm:py-7 md:p-10">
      {/* 화면 정체성 */}
      <h2 className="text-[24px] font-medium tracking-[-0.48px] text-[#212121]">제재 회원 관리</h2>

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
                  onRestore={setRestoreTarget}
                />
                <ReportSection
                  title="신고·처리 댓글"
                  groups={commentGroups}
                  isLoading={selectedComments.isLoading}
                  error={selectedComments.error}
                  onRestore={setRestoreTarget}
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

      <ConfirmModal
        open={restoreTarget != null}
        title={restoreTitle}
        confirmText={restoring ? '복원 중…' : '복원'}
        cancelText="취소"
        onConfirm={handleRestoreConfirm}
        onCancel={() => !restoring && setRestoreTarget(null)}
      />
      <AlertModal
        open={alertState != null}
        title={alertState?.title ?? ''}
        description={alertState?.description ?? ''}
        onClose={() => setAlertState(null)}
      />
    </section>
  );
}
