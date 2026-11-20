/** Route-handler plumbing: typed JSON, uniform errors, zod body parsing. OWNER: h1. */
import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import type { ApiError } from "../types";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (code: string, msg: string) => new HttpError(400, code, msg);
export const unauthorized = () => new HttpError(401, "NO_SESSION", "Pick a demo user first.");
export const forbidden = (code: string, msg: string) => new HttpError(403, code, msg);
export const notFound = (what = "Resource") => new HttpError(404, "NOT_FOUND", `${what} not found.`);
export const conflict = (code: string, msg: string) => new HttpError(409, code, msg);

export function ok<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

type Ctx<P> = { params: Promise<P> };

/** Wrap a route handler: catches HttpError/ZodError and returns ApiError JSON. */
export function handle<P = Record<string, never>>(
  fn: (req: Request, params: P) => Promise<Response>,
) {
  return async (req: Request, ctx: Ctx<P>): Promise<Response> => {
    try {
      const params = ctx?.params ? await ctx.params : ({} as P);
      return await fn(req, params);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json<ApiError>({ error: { code: e.code, message: e.message } }, { status: e.status });
      }
      if (e instanceof ZodError) {
        const message = e.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
        return NextResponse.json<ApiError>({ error: { code: "INVALID_BODY", message } }, { status: 400 });
      }
      console.error(e);
      return NextResponse.json<ApiError>({ error: { code: "INTERNAL", message: "Something went wrong." } }, { status: 500 });
    }
  };
}

export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest("INVALID_JSON", "Body must be JSON.");
  }
  return schema.parse(raw);
}
