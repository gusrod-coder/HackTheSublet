import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/server/db";
import { SESSION_COOKIE, safeNext } from "@/lib/server/session";

/**
 * GET /api/demo/login?u=<userId>&next=<path> — email links land here: become the recipient
 * (same as picking them in the demo switcher), then go to the page the email is about.
 * Demo auth only; the switcher already lets anyone be anyone.
 */
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  // Stay on the host the link was opened on, so the cookie we set is sent on the next request.
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const base = `${proto}://${host}`;
  const user = u ? await prisma.user.findUnique({ where: { id: u } }) : null;
  const res = NextResponse.redirect(new URL(next, base));
  if (user) res.cookies.set(SESSION_COOKIE, user.id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
