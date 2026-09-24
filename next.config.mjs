/** @type {import('next').NextConfig} */
const nextConfig = {
  // 배포는 GitHub 에서 빌드한 standalone 묶음(server.js + 최소 node_modules)을 서버로 옮겨 `node server.js` 로 띄운다 (2026-09-24).
  // 서버에서 npm install · next build 를 돌리지 않으려는 것. .next/static 과 public 은 워크플로가 묶음 안에 따로 넣는다.
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // 로컬 개발 전용: /api 요청을 same-origin(localhost:3000)으로 받아
  // 백엔드로 프록시한다. 이러면 브라우저가 same-site로 인식해
  // refresh 쿠키가 정상 전송된다. 배포 환경에는 영향 없음.
  // 기본은 qa 서버. 로컬 백엔드(8080)에 붙일 때는 .env 에 API_PROXY_TARGET=http://localhost:8080
  // (qa 에 아직 안 올라간 API — 구글 로그인 등 — 를 로컬에서 확인할 때 쓴다)
  // public/icons 는 Next 기본값이 Cache-Control: max-age=0 이라 매 요청이 원본까지 온다.
  // 메일 로고(email-logo.png)가 특히 손해다 — 지메일은 이미지를 자기 프록시로 대신 받아 오는데,
  // max-age=0 이면 프록시가 캐시를 못 잡아 메일을 열 때마다 우리 서버까지 다녀와서 늦게 뜬다.
  // 파일명이 바뀌지 않는 자산이라 하루를 캐시하고, 그동안은 갱신 확인만 하게 둔다(stale-while-revalidate).
  async headers() {
    return [
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },

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
