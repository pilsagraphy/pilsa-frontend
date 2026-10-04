// 관리자 조치의 종류 이름과 설명 — 게시글 관리 · 댓글 관리 · 신고 관리 · 제재 회원 관리가 같은 말을 쓴다 (PM, 2026-09-27).
// 이름은 표(칩·내역)에, 설명은 제목 옆 (i) 풍선(ModerationLegend)에 들어간다.
// 정책 수치(주의 점수, 자동 블라인드 기준 건수)는 운영 관리 > 정책 설정에서 바뀌므로 여기에 숫자를 적지 않는다.

export const MODERATION_KINDS = {
  ADMIN_BLIND: {
    label: '관리자 직접 조치 (블라인드)',
    description:
      '회원 신고 없이 관리자가 바로 가린 글·댓글. 신고 관리에 신고자 ‘관리자’로 올라오며, 거기서 복원하거나 삭제로 확정한다.',
  },
  ADMIN_DELETE: {
    label: '관리자 직접 조치 (삭제)',
    description:
      '회원 신고 없이 관리자가 바로 지운 글·댓글. 작성자에게 주의 점수가 붙고, 신고 관리(처리 완료)와 제재 회원 관리에 남아 언제든 복원할 수 있다.',
  },
  AUTO_BLIND: {
    label: '신고 누적 (블라인드)',
    description:
      '회원 신고가 기준 건수에 닿아 자동으로 가려진 글·댓글. 관리자가 검토해 복원하거나 삭제한다.',
  },
  REPORTED_BLIND: {
    label: '신고에 따른 관리자 조치 (블라인드)',
    description: '회원 신고를 검토한 관리자가 가린 글·댓글. 아직 복원·삭제가 정해지지 않은 상태.',
  },
  REPORTED_DELETE: {
    label: '신고 누적으로 인한 관리자 조치 (삭제)',
    description:
      '회원 신고를 검토한 관리자가 지운 글·댓글. 작성자에게 주의 점수가 붙고 그 신고는 처리 완료가 된다.',
  },
  RESTORE: {
    label: '관리자 복원',
    description:
      '블라인드를 풀거나 삭제를 취소한 것. 붙었던 주의 점수는 회수되고, 남아 있던 신고는 반려로 끝난다.',
  },
};

// (i) 풍선에 늘어놓을 순서
export const MODERATION_LEGEND = [
  MODERATION_KINDS.ADMIN_BLIND,
  MODERATION_KINDS.ADMIN_DELETE,
  MODERATION_KINDS.AUTO_BLIND,
  MODERATION_KINDS.REPORTED_BLIND,
  MODERATION_KINDS.REPORTED_DELETE,
  MODERATION_KINDS.RESTORE,
];
