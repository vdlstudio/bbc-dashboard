import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Decode the JWT directly in the middleware (Edge Runtime compatible).
// We cannot import auth.ts here because it imports `cookies` from `next/headers`
// which is NOT available in the Edge Runtime.
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "bbc-dashboard-secret-change-in-production-2026"
);

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/setup"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow public paths and all API routes (they auth themselves)
  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  if (path.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("bbc_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Token invalid or expired — send to login
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("bbc_session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico).*)"],
};
