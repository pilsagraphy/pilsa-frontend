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

  // ✅ 알림 딥링크(?toastId=)는 게이트를 건너뛴다.
  // 설치형 앱(TWA)을 알림으로 콜드 스타트하면 통과 쿠키가 없는데, 그때 게이트로 보내면
  // 알림이 가리키던 게시글이 사라지고 소개 페이지에 떨어진다. 통과 쿠키를 여기서 심어 이후 이동도 막히지 않게 한다.
  if (req.nextUrl.searchParams.has('toastId')) {
    const res = NextResponse.next();
    res.cookies.set('pilsa_gate_passed', '1', { path: '/', maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

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
