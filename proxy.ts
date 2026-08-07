import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("admin_session")?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const session = await decrypt(sessionCookie);
    if (!session || new Date(session.expiresAt) < new Date()) {
      // Session invalid or expired
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("admin_session");
      return response;
    }
  }

  // Redirect logged-in admin away from login page
  if (pathname === "/login") {
    const sessionCookie = request.cookies.get("admin_session")?.value;
    if (sessionCookie) {
      const session = await decrypt(sessionCookie);
      if (session && new Date(session.expiresAt) > new Date()) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
