/** zod validators for request bodies. Mirrors the *Body types in lib/types.ts. OWNER: h1. */
import { z } from "zod";
import { QUESTIONS } from "../types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

/** int[8], each within its question's option range. */
export const answersSchema = z
  .array(z.number().int())
  .length(QUESTIONS.length)
  .superRefine((arr, ctx) => {
    arr.forEach((a, i) => {
      if (a < 0 || a >= QUESTIONS[i].options.length)
        ctx.addIssue({ code: "custom", path: [i], message: `${QUESTIONS[i].key}: option ${a} out of range` });
    });
  });

/** Partial answers: null = unanswered. */
export const partialAnswersSchema = z
  .array(z.number().int().nullable())
  .length(QUESTIONS.length)
  .superRefine((arr, ctx) => {
    arr.forEach((a, i) => {
      if (a !== null && (a < 0 || a >= QUESTIONS[i].options.length))
        ctx.addIssue({ code: "custom", path: [i], message: `${QUESTIONS[i].key}: option ${a} out of range` });
    });
  });

const weight = z.union([z.literal(0), z.literal(1), z.literal(3)]);

export const createListingSchema = z
  .object({
    name: z.string().trim().max(60).default(""),
    furnished: z.boolean().default(true),
    address: z.string().trim().min(3),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    area: z.string().trim().default(""),
    roomType: z.enum(["private", "shared"]),
    startDate: isoDate,
    endDate: isoDate,
    houseRules: z.string().default(""),
    flags: z.object({ smoking: z.boolean().optional(), pets: z.boolean().optional() }).default({}),
  })
  .refine((b) => b.startDate < b.endDate, { message: "startDate must be before endDate", path: ["endDate"] });

export const updateListingSchema = z.object({
  name: z.string().trim().max(60).optional(),
  furnished: z.boolean().optional(),
  address: z.string().trim().min(3).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  area: z.string().trim().optional(),
  roomType: z.enum(["private", "shared"]).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  houseRules: z.string().optional(),
  flags: z.object({ smoking: z.boolean().optional(), pets: z.boolean().optional() }).optional(),
});

export const inviteSchema = z.object({
  invites: z
    .array(z.object({ email: z.string().trim().toLowerCase().email(), name: z.string().trim().min(1).optional() }))
    .min(1),
});

export const stayerProfileSchema = z.object({ answers: answersSchema });

export const incomingProfileSchema = z.object({
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  destination: z.enum(["medical", "central", "north", "downtown"]).optional(),
  flexDays: z.union([z.literal(0), z.literal(3), z.literal(7), z.literal(14)]).optional(),
  answers: partialAnswersSchema.optional(),
  weights: z.array(weight).length(QUESTIONS.length).optional(),
  dealBreakers: z.array(z.enum(["smoke", "pets", "overnight", "shared"])).optional(),
});

export const decisionSchema = z.object({ decision: z.enum(["approve", "pass"]) });

export const contactSchema = z.object({
  method: z.enum(["email", "phone", "text", "instagram"]),
  value: z.string().trim().min(2).max(120),
});

export const switchSchema = z.object({ userId: z.string().min(1) });
