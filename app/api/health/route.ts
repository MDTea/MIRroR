import { modelName } from "@/lib/openai";
import { persistenceMode } from "@/lib/store";

export async function GET() {
  return Response.json({
    llm: Boolean(process.env.ASU_OPENAI_API_KEY),
    model: modelName(),
    database: persistenceMode(),
  });
}
