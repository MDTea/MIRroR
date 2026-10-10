import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Thread } from "@/lib/types";

const filePath = path.join(process.cwd(), "data", "threads.json");

let chain: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function persistenceMode() {
  return database() ? "supabase" : "file";
}

async function readFileStore(): Promise<Thread[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { threads?: Thread[] };
    return Array.isArray(parsed.threads) ? parsed.threads : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeFileStore(threads: Thread[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify({ threads }, null, 2), "utf8");
}

async function readSupabase(client: SupabaseClient): Promise<Thread[]> {
  const { data, error } = await client
    .from("threads")
    .select("payload")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.payload as Thread);
}

async function writeSupabase(client: SupabaseClient, thread: Thread) {
  const { error } = await client.from("threads").upsert({
    id: thread.id,
    slug: thread.slug,
    payload: thread,
    updated_at: thread.updatedAt,
  });
  if (error) throw new Error(error.message);
}

export function listThreads() {
  return withLock(async () => {
    const client = database();
    const threads = client ? await readSupabase(client) : await readFileStore();
    return threads.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });
}

export function getThread(id: string) {
  return withLock(async () => {
    const client = database();
    const threads = client ? await readSupabase(client) : await readFileStore();
    return threads.find((thread) => thread.id === id) ?? null;
  });
}

export function createThread(thread: Thread) {
  return withLock(async () => {
    const client = database();
    if (client) {
      await writeSupabase(client, thread);
      return thread;
    }
    const threads = await readFileStore();
    threads.push(thread);
    await writeFileStore(threads);
    return thread;
  });
}

export function saveThread(thread: Thread) {
  return withLock(async () => {
    const client = database();
    thread.updatedAt = new Date().toISOString();
    if (client) {
      await writeSupabase(client, thread);
      return thread;
    }
    const threads = await readFileStore();
    const index = threads.findIndex((item) => item.id === thread.id);
    if (index < 0) threads.push(thread);
    else threads[index] = thread;
    await writeFileStore(threads);
    return thread;
  });
}
