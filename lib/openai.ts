import "server-only";

import OpenAI from "openai";

export function modelName() {
  return process.env.ASU_OPENAI_MODEL || "llama4-maverick-17b";
}

export function getClient() {
  const apiKey = process.env.ASU_OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    baseURL: process.env.ASU_OPENAI_BASE_URL || "https://openai.rc.asu.edu/v1",
    apiKey,
  });
}

export async function completeJson(system: string, user: string, maxTokens: number, temperature = 0.5) {
  const client = getClient();
  if (!client) return null;
  const response = await client.chat.completions.create({
    model: modelName(),
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return readJsonObject(response.choices[0]?.message?.content ?? "");
}

export function readJsonObject(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const value: unknown = JSON.parse(raw.slice(start, end + 1));
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
