import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export function middleware(request: NextRequest) {
  if (!isAdminPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Basic ")) {
    let credentials = "";

    try {
      credentials = atob(authorization.replace("Basic ", ""));
    } catch {
      return unauthorized();
    }

    const [providedUsername, providedPassword] = credentials.split(":");

    if (providedUsername === username && providedPassword === password) {
      return NextResponse.next();
    }
  }

  return unauthorized();
}

function unauthorized() {
  return new NextResponse("Autenticación requerida", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Spoilering admin"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
