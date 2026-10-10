"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import { expressionFor, lampWords } from "@/lib/engine";
import { scenes } from "@/lib/scenes";
import { postJson, showingLabel } from "@/lib/status";
import type { Thread } from "@/lib/types";
import { cn } from "@/lib/utils";

const acts = [
  { id: "talk", label: "Talk" },
  { id: "mirror", label: "Switch" },
  { id: "reflect", label: "Look back" },
  { id: "repair", label: "Repair" },
] as const;

export function ChatApp() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [boop, setBoop] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const scene = scenes.find((item) => item.slug === slug) ?? null;

  useEffect(() => {
    let ignore = false;
    async function load() {
      const response = await fetch("/api/threads");
      const data = (await response.json()) as { threads?: Thread[] };
      if (!ignore) setThreads(data.threads ?? []);
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [thread?.updatedAt]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [thread?.messages.length, thread?.mirrorMessages.length, thread?.act, busy, notes]);

  const said = thread?.messages.filter((message) => message.role === "user").length ?? 0;
  const expression = thread ? expressionFor(thread.state, thread.stalled) : "guarded";
  const lamps = thread ? lampWords(thread.state) : [];
  const transcript = thread?.act === "mirror" ? thread.mirrorMessages : thread?.messages ?? [];
  const pendingQuestion = useMemo(() => {
    if (!thread || thread.act !== "reflect") return null;
    return thread.reflection.find((item) => !(notes[item.id] ?? item.answer).trim()) ?? null;
  }, [notes, thread]);

  async function run(task: () => Promise<{ thread: Thread }>) {
    const previous = thread?.shards.length ?? 0;
    setBusy(true);
    setError("");
    try {
      const data = await task();
      setThread(data.thread);
      setBoop((value) => value + 1);
      if (data.thread.shards.length > previous) {
        setError("");
      }
      return data.thread;
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "That message didn't land.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function openChat(nextSlug: string, existing?: Thread) {
    setSlug(nextSlug);
    setError("");
    setDraft("");
    if (existing) {
      setThread(existing);
      setNotes(Object.fromEntries(existing.reflection.map((item) => [item.id, item.answer])));
      return;
    }
    setThread(null);
    setBusy(true);
    try {
      const data = await postJson<{ thread: Thread }>("/api/threads", { slug: nextSlug });
      setThread(data.thread);
      setNotes({});
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Could not start the chat.");
    } finally {
      setBusy(false);
    }
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!thread || !draft.trim() || busy) return;
    const text = draft.trim();
    setDraft("");

    if (thread.act === "reflect" && pendingQuestion) {
      const nextNotes = { ...notes, [pendingQuestion.id]: text };
      setNotes(nextNotes);
      const finished = thread.reflection.every((item) => (nextNotes[item.id] ?? "").trim());
      if (finished) {
        await run(() =>
          postJson("/api/reflect", {
            threadId: thread.id,
            answers: thread.reflection.map((item) => ({ id: item.id, answer: nextNotes[item.id] ?? "" })),
          }),
        );
      }
      box.current?.focus();
      return;
    }

    const mode = thread.act === "mirror" ? "mirror" : thread.act === "repair" ? "repair" : "talk";
    await run(() => postJson("/api/turn", { threadId: thread.id, text, mode }));
    box.current?.focus();
  }

  if (!scene) {
    return (
      <main className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 py-4">
        <p className="text-sm text-muted-foreground">Pick someone. They will not automatically take your side.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {scenes.map((item, index) => {
            const saved = threads.find((entry) => entry.slug === item.slug);
            return (
              <li key={item.slug} className="bubble-in" style={{ animationDelay: `${index * 50}ms` }}>
                <button
                  type="button"
                  onClick={() => void openChat(item.slug, saved)}
                  className="flex w-full items-center gap-3 rounded-3xl border border-border bg-card p-3 text-left hover:bg-secondary"
                >
                  <Portrait slug={item.slug} name={item.character.name} expression={saved ? expressionFor(saved.state, saved.stalled) : "guarded"} className="h-16 w-14 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">{item.character.name}</span>
                      <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{showingLabel(saved)}</span>
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-muted-foreground">{item.logline}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        {busy ? <p className="mt-3 text-sm text-muted-foreground">Opening the chat…</p> : null}
      </main>
    );
  }

  if (!thread) {
    return (
      <main className="grid h-full place-items-center">
        <p className="text-sm text-muted-foreground">Opening the chat…</p>
      </main>
    );
  }

  const mirror = thread.act === "mirror";

  return (
    <main className="mx-auto flex h-full w-full max-w-3xl flex-col px-3 py-3 sm:px-4">
      <p className="sr-only" aria-live="polite">
        {busy ? `${scene.character.name} is typing` : ""}
      </p>
      <header className="flex items-center gap-3 rounded-3xl border border-border bg-card px-3 py-2">
        <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => { setSlug(null); setThread(null); }}>
          Chats
        </button>
        <Portrait
          key={boop}
          slug={scene.slug}
          name={scene.character.name}
          expression={expression}
          mirrored={mirror}
          className="portrait-pop h-12 w-11"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{mirror ? `${scene.character.name} (you)` : scene.character.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {mirror ? "Hearing your own voice" : lamps.map((lamp) => lamp.word).join(" · ")}
          </p>
        </div>
        <ol className="hidden gap-1 sm:flex" aria-label="Progress">
          {acts.map((act) => {
            const done = thread.actsCompleted.includes(act.id) || (act.id === "talk" && said > 0);
            const current = thread.act === act.id;
            return (
              <li
                key={act.id}
                className={cn(
                  "rounded-full px-2 py-1 text-[0.65rem] uppercase tracking-wide",
                  current ? "bg-accent text-accent-foreground" : done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                {act.label}
              </li>
            );
          })}
        </ol>
      </header>

      <div
        ref={scroller}
        className={cn("stage-wash mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-[1.6rem] p-4", mirror && "mirror-sweep")}
        data-mood={expression}
        data-mode={mirror ? "mirror" : "scene"}
        tabIndex={0}
        aria-label="Conversation"
      >
        <p className="bubble-in max-w-md text-sm leading-6 text-stage-foreground/75">{scene.premise}</p>
        {transcript.map((message) => (
          <Bubble key={message.id} role={message.role} text={message.text} name={scene.character.name} mirror={mirror} />
        ))}
        {thread.act === "reflect" && thread.turningPoint ? (
          <p className="bubble-in text-sm italic text-stage-foreground/80">The line that moved the room: “{thread.turningPoint.quote}”</p>
        ) : null}
        {thread.act === "reflect"
          ? thread.reflection.map((item) => {
              const answer = (notes[item.id] ?? item.answer).trim();
              const show = answer || item.id === pendingQuestion?.id;
              if (!show) return null;
              return (
                <div key={item.id} className="contents">
                  <Bubble role="character" text={item.question} name="MIRROR" mirror={false} />
                  {answer ? <Bubble role="user" text={answer} name={scene.character.name} mirror={false} /> : null}
                </div>
              );
            })
          : null}
        {busy ? <Typing name={mirror ? "You, from the other chair" : scene.character.name} /> : null}
      </div>

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={said < 2 || busy} onClick={() => void run(() => postJson("/api/act", { threadId: thread.id, act: "mirror" }))}>
          Switch perspective
        </Button>
        {mirror ? (
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void run(() => postJson("/api/act", { threadId: thread.id, act: "talk" }))}>
            Back to my chair
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="outline" disabled={said < 1 || busy} onClick={() => void run(() => postJson("/api/act", { threadId: thread.id, act: "reflect" }))}>
          Ask me what I assumed
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={!thread.actsCompleted.includes("reflect") || busy} onClick={() => void run(() => postJson("/api/act", { threadId: thread.id, act: "repair" }))}>
          Come back and repair
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void openChat(scene.slug)}>
          New chat
        </Button>
      </div>

      {thread.act === "reflect" && !pendingQuestion ? (
        <p className="mt-3 text-sm text-muted-foreground">Those answers stay with this chat. Come back and repair when you are ready. They will remember the line.</p>
      ) : thread.stalled && thread.act !== "reflect" ? (
        <p className="mt-3 text-sm text-muted-foreground">They stepped back. Switch chairs, or answer the reflection. This chat will not keep absorbing that.</p>
      ) : (
        <form onSubmit={(event) => void send(event)} className="mt-3 flex items-end gap-2">
          <label className="sr-only" htmlFor="line">
            {pendingQuestion ? "Your answer" : "Message"}
          </label>
          <textarea
            id="line"
            ref={box}
            value={draft}
            rows={2}
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={
              pendingQuestion
                ? "Answer in your own words…"
                : mirror
                  ? `Reply as ${scene.character.name}…`
                  : `Message ${scene.character.name}…`
            }
            className="min-h-14 flex-1 resize-none rounded-3xl border border-border bg-card px-4 py-3 text-base outline-none"
          />
          <Button type="submit" variant="accent" disabled={busy || !draft.trim()} className="h-12">
            Send
          </Button>
        </form>
      )}
    </main>
  );
}

function Bubble({
  role,
  text,
  name,
  mirror,
}: {
  role: string;
  text: string;
  name: string;
  mirror: boolean;
}) {
  if (role === "stage") {
    return <p className="bubble-in px-2 text-center text-sm italic text-stage-foreground/75">{text}</p>;
  }
  const mine = role === "user";
  const label = role === "mirror-self" ? "You, from the other chair" : mine && mirror ? `${name} (you)` : mine ? "You" : name;
  return (
    <div className={cn("bubble-in max-w-[85%]", mine ? "ml-auto" : "mr-auto")}>
      <p className="px-2 text-[0.65rem] uppercase tracking-[0.14em] text-stage-foreground/60">{label}</p>
      <p className={mine ? "mt-1 rounded-3xl rounded-br-md bg-accent px-4 py-3 text-accent-foreground" : "mt-1 rounded-3xl rounded-bl-md bg-white/10 px-4 py-3 text-stage-foreground"}>
        {text}
      </p>
    </div>
  );
}

function Typing({ name }: { name: string }) {
  return (
    <div className="mr-auto" aria-hidden="true">
      <p className="px-2 text-[0.65rem] uppercase tracking-[0.14em] text-stage-foreground/60">{name}</p>
      <p className="mt-1 flex w-16 gap-1 rounded-3xl bg-white/10 px-4 py-3">
        <span className="typing-dot size-2 rounded-full bg-stage-foreground" />
        <span className="typing-dot size-2 rounded-full bg-stage-foreground [animation-delay:150ms]" />
        <span className="typing-dot size-2 rounded-full bg-stage-foreground [animation-delay:300ms]" />
      </p>
    </div>
  );
}
