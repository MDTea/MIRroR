import { fail } from "@/lib/api";
import { changeAct } from "@/lib/rehearsal";
import { actBody, readJson } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await readJson(request, actBody);
    const thread = await changeAct(body.threadId, body.act, body.thread);
    return Response.json({ thread });
  } catch (error) {
    return fail(error);
  }
}
