import { NextResponse, type NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

export default async function proxy(req: NextRequest) {
  const session = await decrypt(req.cookies.get("session")?.value);
  const path = req.nextUrl.pathname;
  const home = session?.role === "trainer" ? "/trainer" : "/me";

  if (!session && (path.startsWith("/trainer") || path.startsWith("/me"))) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (session && (path === "/" || path === "/login")) {
    return NextResponse.redirect(new URL(home, req.nextUrl));
  }
  if (session?.role === "client" && path.startsWith("/trainer")) {
    return NextResponse.redirect(new URL("/me", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|manifest).*)"],
};
