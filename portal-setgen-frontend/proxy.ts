import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Usando default export para garantir que o Next.js encontre a função
export default function proxy(request: NextRequest) {
  const token = request.cookies.get("auth-storage")?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/auth/login"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
