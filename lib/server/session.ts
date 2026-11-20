/**
 * Demo auth: the `hf_user` cookie holds a user id, set by the demo switcher
 * (POST /api/demo/switch). No passwords. OWNER: h1.
 */
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { unauthorized } from "./http";

export const SESSION_COOKIE = "hf_user";

export async function currentUser(): Promise<User | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) throw unauthorized();
  return u;
}

/** Only same-site paths for post-login redirects: "/stayer/inbox" yes, "//evil.com" or "https://…" no. */
export function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}
