import type { Thread } from "@/lib/types";

export function showingLabel(thread?: Thread) {
  if (!thread) return "";
  if (thread.actsCompleted.includes("feedback")) return "Completed";
  if (thread.actsCompleted.includes("repair")) return "Second showing";
  if (thread.actsCompleted.includes("reflect")) return "Notes filed";
  if (thread.shards.includes(thread.slug)) return "Switched chairs";
  return "";
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: T & { error?: string };
  try {
    data = (await response.json()) as T & { error?: string };
  } catch {
    throw new Error("The chat could not start. Try that person again.");
  }
  if (!response.ok) {
    throw new Error(data.error || "The rehearsal could not do that.");
  }
  return data;
}
