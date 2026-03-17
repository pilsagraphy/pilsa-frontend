import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // ✅ Next 내부/정적/API 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap')
  ) {
    return NextResponse.next();
  }

  // ✅ 게이트 통과 여부(쿠키)
  const passed = req.cookies.get('pilsa_gate_passed')?.value === '1';
  if (passed) return NextResponse.next();

  // ✅ 첫 방문: / 만 허용, 나머지는 / 로 보냄
  if (pathname !== '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = `from=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// ✅ 파일 확장자 있는 요청(.png .css 등)은 제외
export const config = {
  matcher: ['/((?!.*\\.).*)'],
};
