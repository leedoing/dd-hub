import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isHomePage = request.nextUrl.pathname === '/';
  
  // 이미지 파일 경로 체크
  const isImageFile = request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg)$/i);

  // 로그인이 되어있지 않고, 홈페이지가 아니고, 이미지 파일이 아닌 경우
  if (!token && !isHomePage && !isImageFile) {
    // 현재 접근하려던 URL을 state로 저장
    const searchParams = new URLSearchParams({
      showLogin: 'true',
      callbackUrl: request.nextUrl.pathname,
    });

    // 홈페이지로 리다이렉트하면서 로그인 모달을 표시하도록 state 전달
    const redirectUrl = new URL(`/?${searchParams.toString()}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 