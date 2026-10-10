import { fail } from "@/lib/api";
import { readShowing } from "@/lib/rehearsal";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const thread = await readShowing(id);
    return Response.json({ thread });
  } catch (error) {
    return fail(error);
  }
}
