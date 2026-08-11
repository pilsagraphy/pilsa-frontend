// boardDetail 공통 유틸

// 이미 'YYYY. MM. DD.' 로 포맷된 값인지. ('.' 포함 여부로 판단하면
//  소수점 초가 붙은 ISO 문자열(2026-08-26T10:15:30.123456)까지 통과해 원문이 그대로 찍힌다)
const ALREADY_KOREAN_DATE = /^\d{4}\.\s?\d{1,2}\.\s?\d{1,2}\.?$/;

// 날짜를 'YYYY. MM. DD.' 형식으로 변환한다.
export function formatKoreanDate(value) {
  if (!value) return '';
  if (typeof value === 'string' && ALREADY_KOREAN_DATE.test(value.trim())) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}. ${mm}. ${dd}.`;
}

// 댓글 목록/작성일 표시에 쓰는 'YYYY/MM/DD' 형식
export function formatSlashDate(value) {
  if (!value) return '';
  if (typeof value === 'string' && value.includes('/')) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

// 이전/다음 글 API 경로(예: /api/stu/free/posts/45)에서 postId만 뽑아낸다.
// 게시판마다 경로 형태가 조금씩 달라 마지막 숫자를 postId로 사용한다.
export function extractPostId(apiPath) {
  if (!apiPath) return null;
  const matches = String(apiPath).match(/\d+/g);
  return matches ? matches[matches.length - 1] : null;
}
