import type { Thread } from "@/lib/types";

export function showingLabel(thread?: Thread) {
  if (!thread) return "Unrehearsed";
  if (thread.actsCompleted.includes("repair")) return "Second showing";
  if (thread.actsCompleted.includes("reflect")) return "Notes filed";
  if (thread.shards.includes(thread.slug)) return "Mirrored";
  if (thread.messages.some((message) => message.role === "user")) return "In the room";
  return "Curtain up";
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "The rehearsal could not do that.");
  }
  return data;
}
