// mocks/memberPenalty.js
//
// 제재 회원 관리 페이지용 mock 데이터.
// 실제로는 DB / API 연동으로 대체될 예정이다. (지금은 마크업 확인용)
//
// 회원 이름:  김철수, 김철수1, ..., 김철수7
// 회원 아이디: ch400, ch401, ..., ch407
// 회원 닉네임: 초록초록, 초록초록1, ..., 초록초록7
// 위 8종 값을 순환시켜 총 30명의 예시 회원을 만든다.

const BASE_COUNT = 8; // 김철수~김철수7 / ch400~ch407 / 초록초록~초록초록7
const TOTAL_MEMBERS = 30;

// 신고 row 예시를 만들 때 순환 사용하는 값들
const REPORT_BOARDS = ['자유게시판', '공지사항', 'Q&A', '정보게시판'];
const REPORT_NICKNAMES = ['초록초록', '새소식', '질문과답변', '정보왕'];
const REPORT_REASONS = ['욕설', '스팸', '도배', '비방'];
// 상태 값은 '블라인드'(체크 가능) 또는 '영구삭제'(체크 불가)만 존재한다.
const REPORT_STATUSES = ['블라인드', '영구삭제'];

const suffix = (index) => (index === 0 ? '' : String(index));

// 개별 회원의 신고 게시글/댓글 row 목록을 생성한다.
// 처리일(date)만 담고, '번호'는 처리일 최신순으로 컴포넌트에서 계산한다.
function buildReports(memberIndex, kind, count) {
  return Array.from({ length: count }, (_, i) => {
    const day = String(3 + i).padStart(2, '0'); // 26.02.03, 26.02.04 ...
    return {
      reportId: `${kind}-${memberIndex}-${i}`,
      board: REPORT_BOARDS[(memberIndex + i) % REPORT_BOARDS.length],
      nickname: REPORT_NICKNAMES[(memberIndex + i) % REPORT_NICKNAMES.length],
      reason: REPORT_REASONS[(memberIndex + i) % REPORT_REASONS.length],
      link: `https://pilsa.co.kr/board/${kind}/${memberIndex}-${i}`,
      status: REPORT_STATUSES[i % REPORT_STATUSES.length],
      date: `26.02.${day}`,
    };
  });
}

export const SANCTIONED_MEMBERS = Array.from({ length: TOTAL_MEMBERS }, (_, index) => {
  const base = index % BASE_COUNT;
  const name = `김철수${suffix(base)}`;
  const loginId = `ch40${base}`;
  const nickname = `초록초아러아ㅓ리아ㅓ리아러록파랑${suffix(base)}`;

  // 현재 상태: 짝수번째는 '정지', 홀수번째는 '주의'
  const isSuspended = index % 2 === 0;
  const currentStatus = isSuspended ? '정지' : '주의';

  // 신고 목록 개수: 첫 회원은 6개(스크롤 확인용), 이후 2~5개로 순환
  const postCount = index === 0 ? 6 : 2 + (index % 4);
  const commentCount = index === 0 ? 6 : 2 + ((index + 1) % 4);

  return {
    memberId: index + 1,
    name,
    loginId,
    nickname,
    currentStatus, // '정지' | '주의'
    // 정지일 때만 정지 기간을 가진다.
    suspension: isSuspended ? { start: '26.04.05', end: '26.05.05' } : null,
    stats: {
      cumulativeCaution: { count: (index % 10) + 1, max: 10 }, // 누적 주의
      cumulativeWarning: { count: (index % 5) + 1, max: 5 }, // 누적 경고
      currentStatus, // 현재 상태
      reportDeletedCount: (index % 7) + 1, // 신고 삭제 수
    },
    reportedPosts: buildReports(index, 'post', postCount), // 신고 게시글
    reportedComments: buildReports(index, 'comment', commentCount), // 신고 댓글
  };
});

export default SANCTIONED_MEMBERS;
