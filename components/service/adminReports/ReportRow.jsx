'use client';

import Link from 'next/link';

import RowActionButton from '@/components/shared/admin/RowActionButton';
import RowCheckbox from '@/components/shared/admin/RowCheckbox';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  getReportReasonLabel,
  getReportTargetHref,
  isDeletable,
  truncatePreview,
} from '@/constants/adminReports';

// report: reportId, targetType, targetId, postId, boardName, preview, summary,
//         author, reasonCode, firstReportedAt, status, reports[]
export default function ReportRow({
  report,
  selected = false,
  onSelectChange,
  onRestore,
  onDelete,
}) {
  const targetHref = getReportTargetHref(report);
  const preview = truncatePreview(report.preview);
  const deletable = isDeletable(report);

  return (
    <TableRow className="h-[58px] border-b border-[#b9b9b9] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
      {/* 1. 선택 체크박스 */}
      <TableCell className="px-[4px] text-center">
        <RowCheckbox
          checked={selected}
          onCheckedChange={(checked) => onSelectChange?.(report.reportId, checked)}
          label={`${preview} 선택`}
        />
      </TableCell>

      {/* 2. 대상 미리보기 - 누르면 해당 게시글(댓글이면 원글의 그 댓글)로 이동한다.
             경로를 모르는 게시판이면 링크 없이 텍스트만 보여준다.
             원문 전체는 title로 띄워 15자로 잘린 내용을 확인할 수 있게 한다. */}
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
      <TableCell className="whitespace-nowrap px-[4px] text-center">{report.author}</TableCell>

      {/* 4. 신고 사유 - 여러 건이 들어와도 대표(최초) 사유 하나만 보여준다.
             전체 내역은 복원 · 삭제 모달의 '신고 목록'에서 확인한다. */}
      <TableCell
        className="truncate px-[4px] text-center"
        title={getReportReasonLabel(report.reasonCode)}
      >
        {getReportReasonLabel(report.reasonCode)}
      </TableCell>

      {/* 5. 최초 신고일시 · 상태 */}
      <TableCell className="whitespace-nowrap px-[4px] text-center">{report.firstReportedAt}</TableCell>
      <TableCell className="whitespace-nowrap px-[4px] text-center">{report.status}</TableCell>

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
