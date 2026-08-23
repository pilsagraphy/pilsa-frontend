'use client';

import SelectAllCheckbox from '@/components/shared/admin/SelectAllCheckbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { REPORT_TARGET_LABELS } from '@/constants/adminReports';

import ReportRow from './ReportRow';

// 체크박스 열까지 포함한 전체 열 개수 (빈 목록 안내문 가로 병합에 사용)
const COLUMN_COUNT = 8;

// 열 너비 기준은 디자인(표 전체 915px)의 44 / 247 / 82 / 67 / 113 / 144 / 75 / 143 px다.
//
// 다만 '신고 사유'는 시안 값(113px)을 그대로 쓸 수 없다.
// 시안에 적힌 예시는 '스팸 홍보/도배'(7자)지만 실제 사유 이름은 훨씬 길어서
// '아동 안전 위반 · 아동 성착취물'(15자)까지 온다. 그래서 사유 열을 넓히고,
// 여유가 있는 대상 미리보기 · 최초 신고일시에서 그만큼 덜어냈다.
// (그래도 못 담는 가장 긴 이름은 말줄임 + title 툴팁으로 전체를 확인할 수 있다)
const COLUMNS = [
  { key: 'preview', label: '대상 미리보기', width: 'w-[23%]' },
  { key: 'boardName', label: '게시판', width: 'w-[9%]' },
  { key: 'author', label: '작성자', width: 'w-[8%]' },
  { key: 'reason', label: '신고 사유', width: 'w-[21%]' },
  { key: 'firstReportedAt', label: '최초 신고일시', width: 'w-[13%]' },
  { key: 'status', label: '상태', width: 'w-[8%]' },
  { key: 'actions', label: '관리', width: 'w-[13%]' },
];

// 열이 8개라 셀 좌우 여백(ui/table.jsx 기본 p-2 = 좌우 8px씩)만 합쳐서 128px을 쓴다.
// 시안의 표(915px)는 그런 여백 없이 글자 폭에 맞춰 짜여 있어서, 기본값을 그대로 두면
// 사유처럼 긴 글자가 들어가는 열부터 잘린다. 그래서 좌우 여백을 4px로 줄여 폭을 되찾는다.
const cellPaddingClass = 'px-[4px]';

export default function ReportTable({
  reports,
  targetType,
  selectedIds = [],
  onSelectOne,
  onSelectAll,
  onRestore,
  onDelete,
  loading = false,
  errorMessage = '',
}) {
  const allSelected = reports?.length > 0 && selectedIds.length === reports.length;
  const targetLabel = REPORT_TARGET_LABELS[targetType] ?? '게시글';

  // 로딩 · 에러 · 빈 목록일 때 body에 보여줄 안내문
  const emptyMessage = loading
    ? '불러오는 중입니다.'
    : errorMessage
      ? errorMessage
      : !reports?.length
        ? `신고된 ${targetLabel}이 없습니다.`
        : '';

  return (
    <div className="overflow-x-auto border-t border-[#212121]">
      {/* 열이 8개라 좁은 화면에서는 가로 스크롤로 처리한다.
          table-fixed로 둬야 위에서 잡은 열 너비가 그대로 지켜지고,
          미리보기 내용이 길어도 행 높이(58px)가 늘어나지 않는다. */}
      <Table className="w-full min-w-[915px] table-fixed">
        <TableHeader>
          <TableRow className="h-[46px] border-b border-[#919191] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
            <TableHead className={`w-[5%] text-center ${cellPaddingClass}`}>
              <SelectAllCheckbox
                checked={allSelected}
                disabled={!reports?.length}
                onCheckedChange={onSelectAll}
                label={`신고된 ${targetLabel} 전체 선택`}
              />
            </TableHead>
            {COLUMNS.map((column) => (
              <TableHead
                key={column.key}
                className={`${column.width} ${cellPaddingClass} whitespace-nowrap text-center text-[#919191]`}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {emptyMessage ? (
            <TableRow className="h-[58px] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
              <TableCell colSpan={COLUMN_COUNT} className="text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            reports.map((report) => (
              <ReportRow
                key={report.reportId}
                report={report}
                selected={selectedIds.includes(report.reportId)}
                onSelectChange={onSelectOne}
                onRestore={onRestore}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
