import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const PUBLIC_ACCOUNT_PATHS = ["/compte/connexion", "/compte/inscription", "/compte/mot-de-passe-oublie", "/compte/reinitialiser"];

/**
 * Première barrière (rapide). Chaque page et action d'administration revérifie
 * en plus le rôle en base via requireAdmin().
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_ACCOUNT_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const needsAdmin = pathname.startsWith("/admin");
  if (!session || (needsAdmin && session.role !== "ADMIN")) {
    const url = req.nextUrl.clone();
    url.pathname = "/compte/connexion";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/compte/:path*"] };
