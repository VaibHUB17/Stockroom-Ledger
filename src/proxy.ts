import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Protect root: redirect to products
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/products", request.url));
  }

  // Protect all /products routes
  if (pathname.startsWith("/products")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return res;
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  }

  // Redirect authenticated user away from login page
  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/products", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/products/:path*", "/login"],
};
