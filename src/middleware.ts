import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const currentUser = request.cookies.get('app_user')?.value
  const isLoginPage = request.nextUrl.pathname === '/login'

  // If user is NOT logged in and tries to access home page
  if (!currentUser && !isLoginPage && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user IS logged in and tries to access login page
  if (currentUser && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login'],
}
