/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // 로컬 개발 전용: /api 요청을 same-origin(localhost:3000)으로 받아
  // qa 서버로 프록시한다. 이러면 브라우저가 same-site로 인식해
  // refresh 쿠키가 정상 전송된다. 배포 환경에는 영향 없음.
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    return [
      {
        source: '/api/:path*',
        destination: 'https://qa.pilsa.co.kr/api/:path*',
      },
    ];
  },
};

export default nextConfig;
