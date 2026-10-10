import { fail } from "@/lib/api";
import { speak } from "@/lib/rehearsal";
import { readJson, turnBody } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await readJson(request, turnBody);
    const thread = await speak(body.threadId, body.text, body.mode);
    return Response.json({ thread });
  } catch (error) {
    return fail(error);
  }
}
