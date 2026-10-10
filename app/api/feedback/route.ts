import { fail } from "@/lib/api";
import { giveFeedback } from "@/lib/rehearsal";
import { readJson, threadIdBody } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await readJson(request, threadIdBody);
    const thread = await giveFeedback(body.threadId, body.thread);
    return Response.json({ thread });
  } catch (error) {
    return fail(error);
  }
}
