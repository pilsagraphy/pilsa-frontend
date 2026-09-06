/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // 로컬 개발 전용: /api 요청을 same-origin(localhost:3000)으로 받아
  // 백엔드로 프록시한다. 이러면 브라우저가 same-site로 인식해
  // refresh 쿠키가 정상 전송된다. 배포 환경에는 영향 없음.
  // 기본은 qa 서버. 로컬 백엔드(8080)에 붙일 때는 .env 에 API_PROXY_TARGET=http://localhost:8080
  // (qa 에 아직 안 올라간 API — 구글 로그인 등 — 를 로컬에서 확인할 때 쓴다)
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    const target = (process.env.API_PROXY_TARGET || 'https://qa.pilsa.co.kr').replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
