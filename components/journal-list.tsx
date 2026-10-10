"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getScene } from "@/lib/scenes";
import { showingLabel } from "@/lib/status";
import type { Thread } from "@/lib/types";

export function JournalList() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const response = await fetch("/api/threads");
        const data = (await response.json()) as { threads?: Thread[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Could not open the journal.");
        if (!ignore) setThreads(data.threads ?? []);
      } catch (loadError) {
        if (!ignore) setError(loadError instanceof Error ? loadError.message : "Could not open the journal.");
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!threads) return <p className="text-sm text-muted-foreground">Opening the journal…</p>;
  if (threads.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-8">
        <h2 className="font-display text-3xl">No showings yet</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          The journal keeps the relationship, including the messy parts. A shard appears only after you sit in the other chair.
        </p>
        <Button asChild className="mt-5">
          <Link href="/">Go to the callboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid gap-4">
      {threads.map((thread) => {
        const scene = getScene(thread.slug);
        const status = showingLabel(thread);
        const when = new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(thread.updatedAt));
        return (
          <li key={thread.id} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{when}</p>
                <h2 className="mt-1 font-display text-3xl">{scene?.title ?? thread.slug}</h2>
                <p className="text-sm text-muted-foreground">{scene?.character.name}</p>
              </div>
              {status ? <Badge>{status}</Badge> : null}
            </div>
            {thread.turningPoint ? (
              <blockquote className="mt-4 border-l-2 border-accent pl-4 text-sm leading-6">
                {thread.turningPoint.note} “{thread.turningPoint.quote}”
              </blockquote>
            ) : null}
            {thread.reflection.some((item) => item.answer) ? (
              <ul className="mt-4 space-y-3">
                {thread.reflection.filter((item) => item.answer).map((item) => (
                  <li key={item.id}>
                    <p className="text-sm font-medium">{item.question}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{item.answer}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            <Button asChild className="mt-4" variant="outline">
              <Link href={`/scene/${thread.slug}?thread=${thread.id}`}>Resume</Link>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
