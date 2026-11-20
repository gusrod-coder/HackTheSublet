import { prisma } from "@/lib/server/db";
import { handle, ok } from "@/lib/server/http";
import { currentUser } from "@/lib/server/session";
import { USERS } from "@/prisma/seed-data";
import type { DemoUsersResponse } from "@/lib/types";

/** GET /api/demo/users — everyone, for the demo switcher. */
export const GET = handle(async () => {
  const [users, me] = await Promise.all([prisma.user.findMany({ orderBy: { createdAt: "asc" } }), currentUser()]);
  const hints = new Map(USERS.map((u) => [u.id, u.hint]));
  return ok<DemoUsersResponse>({
    users: users.map((u) => ({ id: u.id, name: u.name, email: u.email, hint: hints.get(u.id) ?? "Added during demo" })),
    currentUserId: me?.id ?? null,
  });
});
