import { HttpError } from "@/lib/schemas";

export function fail(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  const detail = error instanceof Error && error.message ? error.message : "Try that line again.";
  return Response.json({ error: `The rehearsal hit a snag. ${detail}`.slice(0, 240) }, { status: 500 });
}
