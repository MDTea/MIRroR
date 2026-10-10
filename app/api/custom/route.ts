import { fail } from "@/lib/api";
import { openCustom } from "@/lib/rehearsal";
import { customBody, readJson } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await readJson(request, customBody);
    const thread = await openCustom(body.problem, body.scenario);
    return Response.json({ thread }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
