/**
 * Notification email. OWNER: h1.
 * Every email is written to EmailOutbox (visible at /dev/outbox). If SMTP_* env vars are set it is
 * also sent for real, except to sample/example addresses or ones outside EMAIL_ALLOW.
 * Demo: set EMAIL_REDIRECT="team@gmail.com" and mail for sample people goes to team+priya@gmail.com
 * (subject tagged "[to Priya]"), so one real inbox receives every persona's notifications.
 * Emails carry a link, never contact details (gate §2.5) and never message threads (spec §2.6).
 * Never throws: a failed send must not break the action that triggered it.
 */
import nodemailer, { type Transporter } from "nodemailer";
import { prisma } from "./db";

export type EmailKind =
  | "invite"
  | "listing_live"
  | "request_received"
  | "request_approved"
  | "request_declined"
  | "contacts_unlocked";

export interface EmailInput {
  to: { email: string; id?: string; name?: string };
  kind: EmailKind;
  subject: string;
  /** Plain-text body (a greeting is added). */
  body: string;
  /** App path, e.g. "/stayer/inbox". */
  path?: string;
}

const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

let transporter: Transporter | null | undefined;
function smtp(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  transporter =
    SMTP_HOST && SMTP_USER && SMTP_PASS
      ? nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT ?? 465),
          secure: Number(SMTP_PORT ?? 465) === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        })
      : null;
  return transporter;
}

export function emailMode(): "smtp" | "outbox" {
  return smtp() ? "smtp" : "outbox";
}

/** Why a real send would be skipped for this address, or null if it's allowed. */
export function skipReason(email: string): string | null {
  const addr = email.toLowerCase();
  const domain = addr.split("@")[1] ?? "";
  if (/(^|\.)example\.(com|edu|org|net)$/.test(domain)) return "sample address";
  const allow = (process.env.EMAIL_ALLOW ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (allow.length && !allow.some((a) => addr === a || domain === a || domain.endsWith("." + a)))
    return "not in EMAIL_ALLOW";
  return null;
}

/** Email links sign the reader in as the recipient (demo auth), then open the page. */
export function emailLink(path: string, userId?: string): string {
  return userId
    ? `${APP_URL}/api/demo/login?u=${encodeURIComponent(userId)}&next=${encodeURIComponent(path)}`
    : APP_URL + path;
}

/** Where mail for a sample address goes when EMAIL_REDIRECT is set (Gmail-style plus addressing), else null. */
export function redirectFor(email: string, name?: string): string | null {
  const target = process.env.EMAIL_REDIRECT?.trim();
  if (!target || skipReason(email) !== "sample address") return null;
  const [local, domain] = target.split("@");
  if (!local || !domain) return null;
  const tag = (name ?? email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]/g, "");
  return tag ? `${local}+${tag}@${domain}` : target;
}

export async function sendEmail(e: EmailInput): Promise<void> {
  const link = e.path ? emailLink(e.path, e.to.id) : null;
  const text = `Hi ${e.to.name ?? "there"},\n\n${e.body}${link ? `\n\n${link}` : ""}\n\n— burrow (sample prototype for Hack the Lease)`;
  let row;
  try {
    row = await prisma.emailOutbox.create({
      data: { to: e.to.email, toUserId: e.to.id ?? null, kind: e.kind, subject: e.subject, text, link },
    });
  } catch (err) {
    console.error("[email] outbox write failed", err);
    return;
  }
  const t = smtp();
  if (!t) return;
  const redirect = redirectFor(e.to.email, e.to.name);
  const skip = redirect ? null : skipReason(e.to.email);
  if (skip) {
    await prisma.emailOutbox.update({ where: { id: row.id }, data: { status: "skipped", error: skip } }).catch(() => {});
    return;
  }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
      to: redirect ?? e.to.email,
      subject: redirect ? `[to ${e.to.name ?? e.to.email}] ${e.subject}` : e.subject,
      text,
    });
    await prisma.emailOutbox.update({
      where: { id: row.id },
      data: { status: "sent", error: redirect ? `redirected to ${redirect}` : null },
    });
  } catch (err) {
    console.error("[email] send failed", err);
    await prisma.emailOutbox
      .update({ where: { id: row.id }, data: { status: "failed", error: String((err as Error).message ?? err).slice(0, 300) } })
      .catch(() => {});
  }
}
