// 서버가 준 상대 경로(/api/event/images/3 등)를 <img src> 에 넣을 수 있는 주소로 만든다.
// axiosInstance 와 같은 규칙 — 개발 서버는 next.config 의 /api 프록시를 타므로 상대 경로 그대로,
// 배포에서는 API 서버 도메인(NEXT_PUBLIC_BASE_URL)을 앞에 붙인다.
export const apiUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  const base = process.env.NODE_ENV === 'development' ? '' : (process.env.NEXT_PUBLIC_BASE_URL ?? '');
  return `${base}${path}`;
};
