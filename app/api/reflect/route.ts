import { fail } from "@/lib/api";
import { fileNotes } from "@/lib/rehearsal";
import { readJson, reflectBody } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await readJson(request, reflectBody);
    const thread = await fileNotes(body.threadId, body.answers);
    return Response.json({ thread });
  } catch (error) {
    return fail(error);
  }
}
