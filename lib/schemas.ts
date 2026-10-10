import { z } from "zod";

export const createThreadBody = z.object({
  slug: z.string().trim().min(1).max(80),
});

export const turnBody = z.object({
  threadId: z.uuid(),
  text: z.string().trim().min(1).max(2000),
  mode: z.enum(["talk", "mirror", "repair"]),
  thread: z.unknown().optional(),
});

export const customBody = z
  .object({
    problem: z.string().trim().max(2000).optional(),
    scenario: z.unknown().optional(),
  })
  .refine((body) => Boolean(body.scenario) || (body.problem?.length ?? 0) >= 12, {
    message: "Tell me a little more about the situation, at least a sentence.",
  });

export const threadIdBody = z.object({
  threadId: z.uuid(),
  thread: z.unknown().optional(),
});

export const actBody = z.object({
  threadId: z.uuid(),
  act: z.enum(["mirror", "repair", "reflect", "talk"]),
  thread: z.unknown().optional(),
});

export const reflectBody = z.object({
  threadId: z.uuid(),
  thread: z.unknown().optional(),
  answers: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(40),
        answer: z.string().trim().min(1).max(1200),
      }),
    )
    .min(3)
    .max(3),
});

export class HttpError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readJson<T>(request: Request, schema: z.ZodType<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError("The request body was not valid JSON.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new HttpError(issue?.message ?? "That request could not be read.");
  }
  return parsed.data;
}
