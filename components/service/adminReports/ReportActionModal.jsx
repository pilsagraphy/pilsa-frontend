'use client';

import ReasonDialog from '@/components/common/ReasonDialog';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  REPORT_ACTION_DELETE,
  REPORT_ACTION_LABELS,
  REPORT_TARGET_COMMENT,
  REPORT_TARGET_LABELS,
  getReportReasonLabel,
} from '@/constants/adminReports';

// '신고 상세' · '신고자 목록' 소제목 (ReasonDialog의 '사유' 라벨과 같은 크기)
const sectionLabelClass = 'text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]';

// 글자 크기와 색을 나눠 둔다. 한 className에 색 클래스를 두 개 넣으면
// 적용 순서가 CSS 정의 순서에 따라 갈려서(cn 병합이 아니므로) 신고자 이름 색이 흔들린다.
const bodyTypeClass = 'text-[14px] leading-[1.6] tracking-[-0.28px]';
const bodyTextClass = `${bodyTypeClass} text-[#454545]`;

/**
 * 신고 대상 한 건 = 무엇을 처리하는지(신고 상세) + 누가 신고했는지(신고자 목록)
 *
 * 여러 건을 한꺼번에 처리할 때는 이 묶음을 대상마다 반복한다.
 * 신고자 가명(익명A · B · C)은 대상별로 새로 매기는 값이라,
 * 여러 대상의 신고를 한 표에 섞으면 같은 가명이 다른 사람을 뜻하게 되어 잘못 읽힌다.
 */
function ReportTargetBlock({ item }) {
  // 시안에서 게시글과 댓글의 '신고 상세' 줄이 서로 다르다.
  //   게시글 - [자유게시판] 게시글 제목 / 작성자 / 날짜
  //   댓글   - 댓글 내용 / 작성자 / 날짜          ← 게시판 이름을 넣지 않는다
  // 게시판은 목록의 '게시판' 열에서 이미 확인할 수 있다.
  const isComment = item.targetType === REPORT_TARGET_COMMENT;

  return (
    <div className="flex flex-col gap-[16px]">
      {/* 신고 상세 - 무엇을 처리하는지 */}
      <div className="flex flex-col gap-[4px]">
        <span className={sectionLabelClass}>신고 상세</span>
        <p className={bodyTextClass}>
          {!isComment && <span className="text-[#919191]">[{item.boardName}] </span>}
          {item.summary} / {item.author} / {item.createdAt}
        </p>
      </div>

      {/* 신고자 목록 - 누가 · 어떤 사유로 · 언제 신고했는지 */}
      <div className="flex flex-col gap-[4px]">
        <span className={sectionLabelClass}>신고자 목록</span>
        {/* 시안에 열 이름 줄이 없어 헤더 없이 그린다.
            열 이름이 없으면 화면 낭독기로는 순서를 알 수 없어 caption으로 대신 알려준다. */}
        <Table>
          <caption className="sr-only">
            {item.summary}의 신고 접수 내역 (신고자 · 신고 사유 · 상세 사유 · 신고일시 순)
          </caption>
          <TableBody>
            {item.reports?.map((report) => (
              <TableRow key={report.reporterAlias} className="border-none hover:bg-transparent">
                <TableCell
                  className={`w-[56px] whitespace-nowrap px-0 font-semibold text-[#212121] ${bodyTypeClass}`}
                >
                  {report.reporterAlias}
                </TableCell>
                <TableCell className={`whitespace-nowrap px-[8px] ${bodyTextClass}`}>
                  {getReportReasonLabel(report.reasonCode)}
                </TableCell>
                {/* 상세 사유는 신고자가 직접 쓴 말이라 시안처럼 따옴표로 감싼다.
                    길어지면 모달이 넓어지지 않도록 이 칸만 줄여서 말줄임 처리한다. */}
                <TableCell className={`max-w-[220px] px-[8px] ${bodyTextClass}`}>
                  <span className="block truncate" title={report.detail}>
                    {report.detail ? `"${report.detail}"` : '-'}
                  </span>
                </TableCell>
                <TableCell className={`whitespace-nowrap px-0 text-right ${bodyTextClass}`}>
                  {report.reportedAt}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * 관리자 - 신고 관리에서 복원 · 삭제를 확인하는 모달
 *
 * 시안대로 삭제할 때만 사유를 받고, 복원은 확인만 받는다.
 * 선택 복원 · 선택 삭제로 여러 건을 한꺼번에 처리할 때는 대상마다 묶음을 반복해서
 * 어느 대상의 어떤 신고 때문에 조치하는지(=삭제 사유를 무엇으로 고를지) 보고 결정할 수 있게 한다.
 * 실제 처리(API 호출 · 목록 갱신)는 부모가 담당한다.
 */
export default function ReportActionModal({
  open,
  // 'restore' | 'delete'
  action = REPORT_ACTION_DELETE,
  // 'post' | 'comment'
  targetType = 'post',
  // 조치할 신고 목록. 행 버튼이면 1건, 선택 복원 · 선택 삭제면 여러 건이다.
  items = [],
  onClose,
  onSubmit,
}) {
  const targetLabel = REPORT_TARGET_LABELS[targetType] ?? '게시글';
  const actionLabel = REPORT_ACTION_LABELS[action] ?? '삭제';
  const isDelete = action === REPORT_ACTION_DELETE;

  // 되돌리기 어려운 조치라 몇 건을 처리하는지 제목에 밝힌다.
  // 1건일 때는 시안 문구 그대로 둔다.
  const countText = items.length > 1 ? ` ${items.length}건` : '';

  return (
    <ReasonDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      // 삭제만 사유를 받는다 (시안의 복원 모달에는 사유 입력이 없다)
      hideReason={!isDelete}
      confirmLabel={actionLabel}
      // 대상이 하나도 없으면 조치할 것이 없으므로 확인을 막는다
      disabled={items.length === 0}
      // 폭은 내용에 따라 늘어난다. 짧으면 시안 크기를 지키고, 신고 내역이 길면 그만큼 넓어지되
      // 화면을 넘지 않도록 상한을 둔다. min-width는 max-width보다 우선하므로
      // 하한에도 92vw를 걸어야 좁은 화면에서 모달이 잘려나가지 않는다.
      // 여러 건이면 세로로 길어지는데, 모달 내부 스크롤은 ReasonDialog가 처리한다.
      contentClassName="w-auto min-w-[min(505px,92vw)] max-w-[min(760px,92vw)]"
      triggerClassName="w-[296px]"
      // 시안 문구: 삭제는 글 자체를, 복원은 글의 상태를 대상으로 말한다.
      //   신고된 게시글을 삭제 하시겠습니까?  /  신고된 게시글 상태를 복원 하시겠습니까?
      title={
        isDelete ? (
          <>
            신고된 {targetLabel}
            {countText}을 <span className="font-extrabold">{actionLabel}</span> 하시겠습니까?
          </>
        ) : (
          <>
            신고된 {targetLabel}
            {/* 여러 건이면 '게시글 3건의 상태를'로 이어져야 자연스럽다 */}
            {countText && `${countText}의`} 상태를{' '}
            <span className="font-extrabold">{actionLabel}</span> 하시겠습니까?
          </>
        )
      }
      // 디자인에는 없지만 스크린리더 안내와 Radix 경고 방지를 위해 넣는다
      description={`신고된 ${targetLabel} ${items.length}건을 ${actionLabel} 처리합니다.`}
    >
      <div className="flex flex-col gap-[16px]">
        {items.map((item, index) => (
          // 대상이 여러 건이면 어디서 끊기는지 보이도록 묶음 사이에 선을 넣는다
          <div
            key={item.reportId}
            className={index > 0 ? 'border-t border-[#dedede] pt-[16px]' : ''}
          >
            <ReportTargetBlock item={item} />
          </div>
        ))}
      </div>
    </ReasonDialog>
  );
}
