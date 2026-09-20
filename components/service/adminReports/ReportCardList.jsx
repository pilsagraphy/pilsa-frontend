'use client';

import RowActionButton from '@/components/shared/admin/RowActionButton';
import { AdminCard, AdminCardList } from '@/components/shared/admin/AdminCardList';
import {
  formatReportedAt,
  getReportStatusLabel,
  getReportTargetHref,
  isDeletable,
  truncatePreview,
} from '@/constants/adminReports';

// 좁은 화면의 신고 관리 목록.
//
// 표에서 '삭제'를 감추지 않고 흐리게만 둔 건 열 너비가 흔들리지 않게 하려던 것이었다.
// 카드에는 그 제약이 없지만, 왜 못 누르는지 알 수 있게 그대로 흐리게 두고 이유를 붙인다.
export default function ReportCardList({
  reports = [],
  selectedIds = [],
  allowCommentByBoardId,
  onSelectOne,
  onRestore,
  onDelete,
  emptyMessage = '',
}) {
  return (
    <AdminCardList emptyMessage={emptyMessage}>
      {reports.map((report) => {
        const allowComment = allowCommentByBoardId?.get(report.boardId) ?? true;
        const preview = truncatePreview(report.preview);
        const deletable = isDeletable(report);

        return (
          <AdminCard
            key={report.targetId}
            selected={selectedIds.includes(report.targetId)}
            onSelectChange={(checked) => onSelectOne?.(report.targetId, checked)}
            selectLabel={`${preview} 선택`}
            title={preview}
            titleHref={getReportTargetHref(report, allowComment) || undefined}
            stateLabel={getReportStatusLabel(report)}
            metaRows={[
              { label: '게시판', value: report.boardName },
              { label: '작성자', value: report.authorName },
              {
                label: '신고 사유',
                value:
                  report.reportCount > 1
                    ? `${report.reasonLabel} (${report.reportCount})`
                    : report.reasonLabel,
              },
              { label: '최초 신고', value: formatReportedAt(report.firstReportedAt) },
            ]}
            actions={
              <>
                <RowActionButton onClick={() => onRestore?.(report)}>복원</RowActionButton>
                <RowActionButton
                  filled
                  disabled={!deletable}
                  title={deletable ? undefined : '이미 처리된 신고예요'}
                  onClick={() => onDelete?.(report)}
                >
                  삭제
                </RowActionButton>
              </>
            }
          />
        );
      })}
    </AdminCardList>
  );
}
