"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Portrait } from "@/components/portrait";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { expressionFor } from "@/lib/engine";
import { scenes } from "@/lib/scenes";
import { showingLabel } from "@/lib/status";
import type { Thread } from "@/lib/types";
import { cn } from "@/lib/utils";

const acts = ["Talk", "Feel the consequence", "Switch chairs", "Write the notes", "Come back and repair"];

export function HallBoard() {
  const [active, setActive] = useState(scenes[0].slug);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [health, setHealth] = useState<{ llm: boolean; database: string } | null>(null);
  const scene = scenes.find((item) => item.slug === active) ?? scenes[0];
  const latest = threads.find((thread) => thread.slug === scene.slug);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const [threadResponse, healthResponse] = await Promise.all([
        fetch("/api/threads"),
        fetch("/api/health"),
      ]);
      const threadData = (await threadResponse.json()) as { threads?: Thread[] };
      const healthData = (await healthResponse.json()) as { llm: boolean; database: string };
      if (ignore) return;
      setThreads(threadData.threads ?? []);
      setHealth(healthData);
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const shards = new Set(threads.flatMap((thread) => thread.shards));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
      <section className="playbill grid items-end gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">The rehearsal hall</p>
          <h1 className="mt-3 max-w-xl font-display text-6xl leading-[0.9] text-foreground sm:text-7xl">
            Practice being human.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-foreground/80">
            MIRROR is a social simulator for conversations that do not automatically go your way.
            Someone across from you has a goal, a boundary, and a memory. You can sit in their chair.
            If it goes badly, you can come back and repair it.
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">A showing</p>
          <ol className="mt-4 space-y-3">
            {acts.map((act, index) => (
              <li key={act} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground">
                  {index + 1}
                </span>
                <span className="text-sm">{act}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            There is no empathy percentage. The room changes. You notice. That is the game.
          </p>
        </div>
      </section>

      <section aria-labelledby="callboard-title" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="flex items-end justify-between gap-3">
            <h2 id="callboard-title" className="font-display text-4xl">
              Tonight&apos;s callboard
            </h2>
            <p className="text-sm text-muted-foreground">{shards.size}/6 shards</p>
          </div>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
            {scenes.map((item) => {
              const thread = threads.find((entry) => entry.slug === item.slug);
              const selected = item.slug === scene.slug;
              return (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => setActive(item.slug)}
                    onFocus={() => setActive(item.slug)}
                    onMouseEnter={() => setActive(item.slug)}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-secondary",
                      selected && "bg-secondary",
                    )}
                  >
                    <span className="w-8 font-display text-2xl text-muted-foreground">{item.numeral}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{item.title}</span>
                      <span className="block truncate text-sm text-muted-foreground">{item.character.name}</span>
                    </span>
                    <Badge>{showingLabel(thread)}</Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <article className="flex flex-col justify-between rounded-[2rem] border border-border bg-stage p-6 text-stage-foreground sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row">
            <Portrait
              slug={scene.slug}
              name={scene.character.name}
              expression={latest ? expressionFor(latest.state, latest.stalled) : "guarded"}
              className="mx-auto h-52 w-44 shrink-0"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-stage-foreground/70">
                {scene.numeral} · {scene.minutes}
              </p>
              <h3 className="mt-2 font-display text-5xl leading-none">{scene.title}</h3>
              <p className="mt-4 text-base leading-7 text-stage-foreground/85">{scene.logline}</p>
              <p className="mt-3 text-sm leading-6 text-stage-foreground/70">
                {scene.character.name}, {scene.character.pronouns}. {scene.character.role}.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href={latest ? `/scene/${scene.slug}?thread=${latest.id}` : `/scene/${scene.slug}`}>
                Step into the scene
              </Link>
            </Button>
            <p className="text-sm text-stage-foreground/70">{showingLabel(latest)}</p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-border bg-card p-5">
          <h2 className="font-display text-2xl">They can disagree</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Being pleasant does not clear the conflict. Honesty can tighten the room and build trust at the same time.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-5">
          <h2 className="font-display text-2xl">Switch chairs</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            At the hard moment, you become them. The voice across the table is built from the way you actually spoke.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-5">
          <h2 className="font-display text-2xl">Come back</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A bad showing is not deleted. They remember the line. Repair is a second performance, not a new game.
          </p>
        </article>
      </section>

      {health ? (
        <p className="text-sm text-muted-foreground">
          {health.llm
            ? "The company is improvising with the live model."
            : "House script is on. Add your key to the env file and restart, and the actors start improvising."}{" "}
          {health.database === "supabase"
            ? "Showings are stored in Supabase."
            : "Showings are stored on this machine until Supabase is connected."}
        </p>
      ) : null}
    </div>
  );
}
