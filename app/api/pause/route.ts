import { fail } from "@/lib/api";
import { holdBeat } from "@/lib/rehearsal";
import { readJson, threadIdBody } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await readJson(request, threadIdBody);
    const thread = await holdBeat(body.threadId);
    return Response.json({ thread });
  } catch (error) {
    return fail(error);
  }
}
