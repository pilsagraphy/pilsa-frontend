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

  // ✅ 설치형 앱(TWA·홈 화면 앱)의 시작 URL 은 /?launch=app — 앱을 켤 때마다 시계를 보여야 하므로 통과 쿠키가 있어도 게이트로 둔다.
  // 예전엔 통과 쿠키를 세션 쿠키로 두고 "앱을 끄면 사라진다"에 기댔는데, 안드로이드 크롬은 종료 뒤에도 세션 쿠키를
  // 복원해서 첫 실행 이후로는 시계가 다시 나오지 않았다. 쿠키 수명이 아니라 진입 URL 로 앱 실행을 구분한다.
  const isAppLaunch = pathname === '/' && req.nextUrl.searchParams.has('launch');

  if (passed) {
    // 이미 통과한 사람에게 / 는 시계 게이트가 아니라 소개 페이지다 (앱 실행 진입은 예외).
    // 헤더 로고와 같은 사이트 안 이동에서 / 로 오면, 이게 없으면 누를 때마다 시계가 다시 나온다.
    if (pathname === '/' && !isAppLaunch) {
      const url = req.nextUrl.clone();
      url.pathname = '/about/intro';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ✅ 알림 딥링크(?toastId=)는 게이트를 건너뛴다.
  // 설치형 앱(TWA)을 알림으로 콜드 스타트하면 통과 쿠키가 없는데, 그때 게이트로 보내면
  // 알림이 가리키던 게시글이 사라지고 소개 페이지에 떨어진다. 통과 쿠키를 여기서 심어 이후 이동도 막히지 않게 한다.
  if (req.nextUrl.searchParams.has('toastId')) {
    const res = NextResponse.next();
    res.cookies.set('pilsa_gate_passed', '1', { path: '/' }); // 세션 쿠키 — 앱을 껐다 켜면 시계부터 다시
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
