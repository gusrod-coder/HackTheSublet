import { prisma } from "@/lib/server/db";
import { handle, ok } from "@/lib/server/http";
import { seedDatabase } from "@/prisma/seed-data";

/** POST /api/demo/reset — wipe and reseed the sample data (between demo runs). */
export const POST = handle(async () => {
  await seedDatabase(prisma);
  return ok({ ok: true });
});
