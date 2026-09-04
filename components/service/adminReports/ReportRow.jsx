'use client';

import Link from 'next/link';

import RowActionButton from '@/components/shared/admin/RowActionButton';
import RowCheckbox from '@/components/shared/admin/RowCheckbox';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  formatReportedAt,
  getReportStatusLabel,
  getReportTargetHref,
  isDeletable,
  truncatePreview,
} from '@/constants/adminReports';

// report: targetId, targetType, postId, boardId, boardName, preview, authorName,
//         reasonLabel, firstReportedAt, reportCount, state, reportStatus
//
// 행을 가리키는 키는 targetId 다 — 목록이 대상 단위로 그룹핑되어 오므로 신고 id 가 없다.
// allowComment: 이 행의 게시판에 댓글 영역이 있는지 (댓글 앵커 링크를 걸 수 있는지)
export default function ReportRow({
  report,
  selected = false,
  allowComment = true,
  onSelectChange,
  onRestore,
  onDelete,
}) {
  const targetHref = getReportTargetHref(report, allowComment);
  const preview = truncatePreview(report.preview);
  const deletable = isDeletable(report);

  return (
    <TableRow className="h-[58px] border-b border-[#b9b9b9] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
      {/* 1. 선택 체크박스 */}
      <TableCell className="px-[4px] text-center">
        <RowCheckbox
          checked={selected}
          onCheckedChange={(checked) => onSelectChange?.(report.targetId, checked)}
          label={`${preview} 선택`}
        />
      </TableCell>

      {/* 2. 대상 미리보기 - 누르면 해당 게시글(댓글이면 원글의 그 댓글)로 이동한다.
             경로를 모르는 게시판이면 링크 없이 텍스트만 보여준다.
             원문 전체는 title로 띄워 15자로 잘린 내용을 확인할 수 있게 한다.
             (서버가 앞 30자만 주므로 title 도 30자까지다) */}
      <TableCell className="px-[4px] text-center">
        {targetHref ? (
          <Link
            href={targetHref}
            title={report.preview}
            className="block truncate underline decoration-solid underline-offset-2 hover:text-[#212121]"
          >
            {preview}
          </Link>
        ) : (
          <span
            title={report.preview}
            className="block truncate underline decoration-solid underline-offset-2"
          >
            {preview}
          </span>
        )}
      </TableCell>

      {/* 3. 게시판 · 작성자 */}
      <TableCell className="whitespace-nowrap px-[4px] text-center">{report.boardName}</TableCell>
      <TableCell className="whitespace-nowrap px-[4px] text-center">
        {report.authorName}
      </TableCell>

      {/* 4. 신고 사유 - 여러 건이 들어와도 대표(최초) 사유 하나만 보여준다.
             서버가 라벨까지 완성해 주므로 코드→이름 변환이 필요 없다.
             같은 대상에 신고가 여럿이면 건수를 덧붙여 대표 사유 하나만 보이는 것을 알린다. */}
      <TableCell className="truncate px-[4px] text-center" title={report.reasonLabel}>
        {report.reasonLabel}
        {report.reportCount > 1 && (
          <span className="text-[#919191]"> ({report.reportCount})</span>
        )}
      </TableCell>

      {/* 5. 최초 신고일시 · 상태 */}
      <TableCell className="whitespace-nowrap px-[4px] text-center">
        {formatReportedAt(report.firstReportedAt)}
      </TableCell>
      <TableCell className="whitespace-nowrap px-[4px] text-center">
        {getReportStatusLabel(report)}
      </TableCell>

      {/* 6. 관리 - 복원(블라인드 해제 · 삭제 되살리기) · 삭제(소프트 딜리트)
             복원은 어떤 상태에서도 할 수 있다. 이미 삭제된 행에서 할 일이 없는 것은 삭제뿐이라
             삭제 버튼만 비활성으로 둔다.
             버튼을 없애면 관리 열 너비가 행마다 달라져 표가 흔들리므로 회색으로 비활성만 한다. */}
      <TableCell className="px-[4px] text-center">
        <div className="flex items-center justify-center gap-[8px]">
          <RowActionButton className="min-w-[44px]" onClick={() => onRestore?.(report)}>
            복원
          </RowActionButton>
          <RowActionButton
            filled
            className="min-w-[44px]"
            disabled={!deletable}
            onClick={() => onDelete?.(report)}
          >
            삭제
          </RowActionButton>
        </div>
      </TableCell>
    </TableRow>
  );
}
