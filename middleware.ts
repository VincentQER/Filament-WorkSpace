import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie-name";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const nextParam = `${pathname}${search}`;
  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  url.searchParams.set("next", nextParam);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/my-inventory/:path*"],
};
