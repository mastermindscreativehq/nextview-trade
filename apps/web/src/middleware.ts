import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PATHS = [
  "/dashboard",
  "/markets",
  "/trade",
  "/portfolio",
  "/positions",
  "/orders",
  "/transactions",
  "/watchlist",
  "/deposits",
  "/withdrawals",
  "/settings",
  "/profile",
  "/notifications",
];

const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password", "/update-password"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = matches(pathname, PROTECTED_PATHS);
  const isAuthPage = matches(pathname, AUTH_ONLY_PATHS);

  // Unauthenticated users never reach the app shell.
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users are kept out of the login/registration screens.
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/markets/:path*",
    "/trade/:path*",
    "/portfolio/:path*",
    "/positions/:path*",
    "/orders/:path*",
    "/transactions/:path*",
    "/watchlist/:path*",
    "/deposits/:path*",
    "/withdrawals/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/update-password",
  ],
};