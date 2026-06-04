import { NextResponse } from "next/server";
import { auth } from "@/auth";

const authPages = ["/login", "/register"];
const protectedPrefixes = ["/dashboard", "/settings", "/streaks", "/tasks"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAuthPage = authPages.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isProtected = protectedPrefixes.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/streaks/:path*",
    "/tasks/:path*",
    "/login",
    "/register",
  ],
};
