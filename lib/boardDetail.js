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

// 댓글 작성 시각까지 보여주는 'YYYY/MM/DD HH:mm' 형식
export function formatSlashDateTime(value) {
  if (!value) return '';

  const d = new Date(value);
  // 이미 포맷된 문자열이거나 해석할 수 없는 값이면 그대로 둔다
  if (Number.isNaN(d.getTime())) return String(value);

  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${formatSlashDate(value)} ${hh}:${mi}`;
}

// 목록 화면의 상태(페이지·정렬·검색어·카테고리)를 주소 쿼리로 옮긴다.
// 글 상세로 갈 때 이 값을 그대로 달고 다녀서, 목록으로 돌아올 때 보던 화면이 그대로 복원된다.
// (뒤로가기 기록에 기대지 않으므로 글 → 글 → 목록 으로 옮겨다녀도 정확하다)
export const BOARD_LIST_PARAM_KEYS = ['page', 'sort', 'keyword', 'categoryId'];

// source 는 URLSearchParams 도 되고 { page, sort, ... } 형태의 객체도 된다.
export function buildBoardListQuery(source) {
  if (!source) return '';

  const read = typeof source.get === 'function' ? (key) => source.get(key) : (key) => source[key];

  const params = new URLSearchParams();
  BOARD_LIST_PARAM_KEYS.forEach((key) => {
    const value = read(key);
    if (value != null && String(value).trim() !== '') params.set(key, String(value));
  });

  return params.toString();
}

// 이전/현재/다음 글 줄에 쓰는 'YYYY.MM.DD' 형식
export function formatDotDate(value) {
  if (!value) return '';

  // 이미 '2026. 02. 20.' / '2026.02.20' 형태로 들어오면 공백·끝점만 정리한다
  if (typeof value === 'string' && /^\d{4}\.\s?\d{1,2}\.\s?\d{1,2}/.test(value)) {
    return value.replace(/\s/g, '').replace(/\.$/, '');
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

// 이전/다음 글 API 경로(예: /api/stu/free/posts/45)에서 postId만 뽑아낸다.
// 게시판마다 경로 형태가 조금씩 달라 마지막 숫자를 postId로 사용한다.
export function extractPostId(apiPath) {
  if (!apiPath) return null;
  const matches = String(apiPath).match(/\d+/g);
  return matches ? matches[matches.length - 1] : null;
}
