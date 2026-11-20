import { prisma } from "@/lib/server/db";
import { forbidden, handle, ok } from "@/lib/server/http";
import { seedDatabase } from "@/prisma/seed-data";

/**
 * Requests that arrived on the public address (Tailscale Funnel: https://<machine>.<tailnet>.ts.net).
 * The tailnet IP (100.x) and localhost stay passcode-free for the team and the smoke test.
 */
function viaPublicHost(req: Request): boolean {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase();
  return host.endsWith(".ts.net");
}

/**
 * POST /api/demo/reset { code? } — wipe and reseed the sample data (between demo runs).
 * On the public address it needs DEMO_RESET_CODE (if set), so a stranger can't reset mid-demo.
 */
export const POST = handle(async (req) => {
  const code = process.env.DEMO_RESET_CODE?.trim();
  if (code && viaPublicHost(req)) {
    const body = (await req.json().catch(() => null)) as { code?: unknown } | null;
    if (body?.code !== code) throw forbidden("RESET_CODE", "Enter the demo passcode to reset.");
  }
  await seedDatabase(prisma);
  return ok({ ok: true });
});
