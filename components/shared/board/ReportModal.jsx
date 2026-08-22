'use client';

import ReasonDialog from '@/components/common/ReasonDialog';
import { formatMemberLabel } from '@/lib/utils';

/**
 * 게시글/댓글 신고 모달
 * onSubmit으로 { reason, detail }을 넘겨주고, 실제 전송은 부모가 처리한다.
 * 사유 선택 · 기타 상세 사유 · 취소/확인은 ReasonDialog가 담당한다.
 */
export default function ReportModal({
  open,
  onClose,
  onSubmit,
  targetLabel = '댓글',
  // { loginId, studentId, name } - 서버가 주지 않는 값은 자동으로 생략된다
  targetUser = null,
  targetContent = '',
}) {
  const targetUserText = formatMemberLabel(targetUser);

  return (
    <ReasonDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      contentClassName="max-w-[346px]"
      title={
        <>
          해당 {targetLabel}을 <span className="font-extrabold">신고</span> 하시겠습니까?
        </>
      }
      // 디자인에는 없지만 스크린리더 안내와 Radix 경고 방지를 위해 넣는다
      description={`해당 ${targetLabel}의 신고 사유를 고릅니다.`}
    >
      {targetUserText && (
        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">
            대상 회원
          </span>
          <span className="break-all text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
            {targetUserText}
          </span>
        </div>
      )}

      {targetContent && (
        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">
            대상 게시글
          </span>
          <span className="line-clamp-2 break-words text-[14px] leading-[1.6] tracking-[-0.28px] text-[#454545]">
            {targetContent}
          </span>
        </div>
      )}
    </ReasonDialog>
  );
}
