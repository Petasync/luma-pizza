import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname === '/admin/login'
  if (req.nextUrl.pathname.startsWith('/admin') && !isLoginPage) {
    const auth = req.cookies.get('admin_auth')?.value
    if (auth !== process.env.ADMIN_PASSWORD) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
