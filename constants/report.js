// 신고 사유 (백엔드 GET /api/user/reports/reasons 응답과 1:1 대응)
//
// 배열 순서 = 서버가 주는 displayOrder 순서다. 화면에는 이 순서대로 보여주므로
// displayOrder를 따로 들고 있지 않는다.
// reasonId는 DB 기본키로, 나중에 추가된 CHILD_SAFETY가 10번인 것처럼 화면 순서와 일치하지 않는다.
//
// TODO: API 연동 시 이 상수 대신 GET /api/user/reports/reasons 응답을 쓸 것.
//       사유가 추가·변경될 때 프론트를 같이 고치지 않아도 되게 하려면 서버 목록이 정답이다.
export const REPORT_REASONS = [
  { reasonId: 1, code: 'SPAM', label: '스팸 · 홍보/도배' },
  { reasonId: 2, code: 'ABUSE', label: '욕설 · 비방 · 혐오 표현' },
  { reasonId: 3, code: 'ADULT', label: '음란 · 부적절한 콘텐츠' },
  { reasonId: 10, code: 'CHILD_SAFETY', label: '아동 안전 위반 · 아동 성착취물' },
  { reasonId: 4, code: 'PRIVACY', label: '개인정보 노출 · 사생활 침해' },
  { reasonId: 5, code: 'FRAUD', label: '허위사실 · 사기' },
  { reasonId: 6, code: 'COPYRIGHT', label: '저작권 침해' },
  { reasonId: 7, code: 'OFF_TOPIC', label: '게시판 성격에 맞지 않는 글' },
  { reasonId: 8, code: 'ETC', label: '기타' },
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
