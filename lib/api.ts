import { HttpError } from "@/lib/schemas";

export function fail(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "The rehearsal hit a snag. Try that line again." }, { status: 500 });
}
