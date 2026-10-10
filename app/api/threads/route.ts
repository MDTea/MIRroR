import { fail } from "@/lib/api";
import { listShowings, openShowing } from "@/lib/rehearsal";
import { createThreadBody, readJson } from "@/lib/schemas";

export async function GET() {
  try {
    const threads = await listShowings();
    return Response.json({ threads });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request, createThreadBody);
    const thread = await openShowing(body.slug);
    return Response.json({ thread }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
