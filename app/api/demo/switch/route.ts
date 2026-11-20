import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { handle, notFound, parseBody } from "@/lib/server/http";
import { switchSchema } from "@/lib/server/schemas";
import { SESSION_COOKIE } from "@/lib/server/session";

/** POST /api/demo/switch { userId } — become that user (sets the session cookie). */
export const POST = handle(async (req) => {
  const { userId } = await parseBody(req, switchSchema);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound("User");
  const res = NextResponse.json({ user: { id: user.id, name: user.name } });
  res.cookies.set(SESSION_COOKIE, user.id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  return res;
});

/** DELETE /api/demo/switch — sign out. */
export const DELETE = handle(async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
});
