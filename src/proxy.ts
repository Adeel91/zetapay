import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUDITOR, DASHBOARD, EMPLOYER, ROUTES } from '@/config';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith(DASHBOARD)) {
    const role = request.cookies.get('zetaRole')?.value;

    if (!role) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (path.startsWith(ROUTES.employer.root) && role !== EMPLOYER) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (path.startsWith(ROUTES.auditor.root) && role !== AUDITOR) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
