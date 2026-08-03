// 신고 사유 (백엔드 reports.reason 코드와 1:1 대응)
export const REPORT_REASONS = [
  { code: 'SPAM', label: '스팸 · 홍보/도배' },
  { code: 'ABUSE', label: '욕설 · 비방 · 혐오 표현' },
  { code: 'ADULT', label: '음란 · 부적절한 콘텐츠' },
  { code: 'PRIVACY', label: '개인정보 노출 · 사생활 침해' },
  { code: 'FRAUD', label: '허위사실 · 사기' },
  { code: 'COPYRIGHT', label: '저작권 침해' },
  { code: 'OFF_TOPIC', label: '게시판 성격에 맞지 않는 글' },
  { code: 'ETC', label: '기타' },
];

// 이 사유를 선택한 경우에만 상세 사유(detail)를 입력받는다
export const REPORT_REASON_ETC = 'ETC';

// detail 최대 길이 (DB varchar(500))
export const REPORT_DETAIL_MAX_LENGTH = 500;

// 신고 접수 완료 안내
export const REPORT_SUCCESS_ALERT = {
  title: '신고가 접수되었습니다.',
  description:
    '운영진이 확인 후 조치하며,\n결과는 별도로 안내되지 않습니다.\n신고자 정보는 공개되지 않습니다.',
};

// 이미 신고한 대상일 때 안내 (서버에서 중복 신고를 차단함)
export const REPORT_DUPLICATE_ALERT = {
  title: '이미 신고한 게시물입니다.',
  description: '중복 신고는 접수되지 않습니다.',
};
