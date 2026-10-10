"use client";

import { useEffect, useRef, useState } from "react";
import { FeedbackView } from "@/components/feedback-view";
import { Portrait } from "@/components/portrait";
import { ScenarioComposer } from "@/components/scenario-composer";
import { Button } from "@/components/ui/button";
import { expressionFor } from "@/lib/engine";
import { scenes } from "@/lib/scenes";
import { postJson, showingLabel } from "@/lib/status";
import type { Thread } from "@/lib/types";
import { cn } from "@/lib/utils";

const acts = [
  { id: "talk", label: "Talk" },
  { id: "mirror", label: "Switch" },
  { id: "feedback", label: "Feedback" },
] as const;

const SWITCH_AFTER_MS = 2 * 60 * 1000;
const savedKey = "mirror-threads";

function readSaved(): Thread[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(savedKey) ?? "") as { threads?: Thread[] };
    return Array.isArray(parsed.threads) ? parsed.threads : [];
  } catch {
    return [];
  }
}

function remember(thread: Thread) {
  try {
    const next = [thread, ...readSaved().filter((item) => item.id !== thread.id)].slice(0, 24);
    localStorage.setItem(savedKey, JSON.stringify({ threads: next }));
  } catch {
    // The chat still works for this visit if the browser blocks storage.
  }
}

export function ChatApp() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [boop, setBoop] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const scene = thread?.custom?.scene ?? scenes.find((item) => item.slug === slug) ?? null;

  useEffect(() => {
    let ignore = false;
    async function load() {
      const local = readSaved();
      try {
        const response = await fetch("/api/threads");
        const data = (await response.json()) as { threads?: Thread[] };
        const remote = data.threads ?? [];
        const byId = new Map(local.map((item) => [item.id, item]));
        for (const item of remote) byId.set(item.id, item);
        if (!ignore) setThreads([...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      } catch {
        if (!ignore) setThreads(local);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [thread?.updatedAt]);

  useEffect(() => {
    if (thread?.act === "feedback") {
      scroller.current?.scrollTo({ top: 0 });
      return;
    }
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [thread?.messages.length, thread?.mirrorMessages.length, thread?.act, busy]);

  useEffect(() => {
    const home = () => {
      setSlug(null);
      setThread(null);
      setError("");
    };
    window.addEventListener("mirror-home", home);
    return () => window.removeEventListener("mirror-home", home);
  }, []);

  const firstAt = thread?.messages.find((message) => message.role === "user")?.at ?? null;
  const readyAt = firstAt ? new Date(firstAt).getTime() + SWITCH_AFTER_MS : null;

  useEffect(() => {
    if (readyAt === null) return;
    const id = window.setTimeout(() => setClock(Date.now()), Math.max(0, readyAt - Date.now()) + 50);
    return () => window.clearTimeout(id);
  }, [readyAt]);

  const said = thread?.messages.filter((message) => message.role === "user").length ?? 0;
  const expression = thread ? expressionFor(thread.state, thread.stalled) : "guarded";

  async function run(task: () => Promise<{ thread: Thread }>) {
    setBusy(true);
    setError("");
    try {
      const data = await task();
      remember(data.thread);
      setSlug(data.thread.slug);
      setThread(data.thread);
      setBoop((value) => value + 1);
      return data.thread;
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "That message didn't land.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function openThread(next: Thread) {
    remember(next);
    setError("");
    setDraft("");
    setSlug(next.slug);
    setThread(next);
  }

  async function openChat(nextSlug: string, existing?: Thread) {
    setSlug(nextSlug);
    setError("");
    setDraft("");
    if (existing) {
      setThread(existing);
      return;
    }
    setThread(null);
    setBusy(true);
    try {
      const data = await postJson<{ thread: Thread }>("/api/threads", { slug: nextSlug });
      remember(data.thread);
      setThread(data.thread);
    } catch (openError) {
      setSlug(null);
      setThread(null);
      setError(openError instanceof Error ? openError.message : "Could not start the chat.");
    } finally {
      setBusy(false);
    }
  }

  async function restart() {
    if (!thread) return;
    setDraft("");
    if (thread.custom) {
      const custom = thread.custom;
      await run(() => postJson("/api/custom", { scenario: custom }));
      return;
    }
    await openChat(thread.slug);
  }

  async function askFeedback() {
    if (!thread) return;
    const current = thread;
    setReviewing(true);
    await run(() => postJson("/api/feedback", { threadId: current.id, thread: current }));
    setReviewing(false);
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!thread || !draft.trim() || busy) return;
    const text = draft.trim();
    setDraft("");
    const mode = thread.act === "mirror" ? "mirror" : thread.act === "repair" ? "repair" : "talk";
    await run(() => postJson("/api/turn", { threadId: thread.id, text, mode, thread }));
    box.current?.focus();
  }

  if (!scene) {
    const recent = threads.filter((item) => item.custom).slice(0, 4);
    return (
      <main className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 pb-16">
          <p className="text-sm text-muted-foreground">Pick someone. They will not automatically take your side.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {scenes.map((item, index) => {
              const saved = threads.find((entry) => entry.slug === item.slug);
              const status = showingLabel(saved);
              return (
                <li key={item.slug} className="bubble-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <button
                    type="button"
                    onClick={() => void openChat(item.slug, saved)}
                    className="flex w-full items-center gap-3 rounded-3xl border border-border bg-card/85 p-3 text-left backdrop-blur-sm hover:bg-secondary"
                  >
                    <Portrait slug={item.slug} name={item.character.name} expression={saved ? expressionFor(saved.state, saved.stalled) : "guarded"} className="h-16 w-14 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-medium">{item.character.name}</span>
                        {status ? <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{status}</span> : null}
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

          <ScenarioComposer onReady={openThread} />

          {recent.length ? (
            <section className="mt-6">
              <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your scenarios</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {recent.map((item) => {
                  const own = item.custom!.scene;
                  const status = showingLabel(item);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openThread(item)}
                        className="flex w-full items-center gap-3 rounded-3xl border border-border bg-card/85 p-3 text-left backdrop-blur-sm hover:bg-secondary"
                      >
                        <Portrait slug={own.slug} name={own.character.name} expression={expressionFor(item.state, item.stalled)} className="h-14 w-12 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium">{own.character.name}</span>
                            {status ? <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{status}</span> : null}
                          </span>
                          <span className="mt-1 block truncate text-sm text-muted-foreground">{own.title}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      </main>
    );
  }

  if (!thread) {
    return (
      <main className="grid h-full place-items-center gap-3 px-6 text-center">
        <p className="text-sm text-muted-foreground">{error || "Opening the chat…"}</p>
        {error ? (
          <Button type="button" variant="outline" onClick={() => { setSlug(null); setError(""); }}>
            Back to chats
          </Button>
        ) : null}
      </main>
    );
  }

  const mirror = thread.act === "mirror";
  const finished = thread.act === "feedback" && Boolean(thread.feedback);
  const talking = thread.act === "talk" || thread.act === "repair";
  const transcript = mirror ? thread.mirrorMessages : thread.messages;
  const mirrorReplies = thread.mirrorMessages.filter((message) => message.role === "user").length;
  const switchReady = readyAt !== null && clock >= readyAt;
  const showSwitch = talking && said >= 2 && (switchReady || thread.stalled) && !busy;
  const offerFeedback = !finished && !reviewing && ((mirror && mirrorReplies >= 2) || thread.stalled || thread.act === "reflect");
  const canType = (talking || mirror) && !thread.stalled;
  const home = () => {
    setSlug(null);
    setThread(null);
  };

  return (
    <main className="mx-auto flex h-full w-full max-w-3xl flex-col px-3 py-3 sm:px-4">
      <p className="sr-only" aria-live="polite">
        {busy ? (reviewing ? "Reviewing your responses" : `${scene.character.name} is typing`) : ""}
      </p>
      <header className="flex items-center gap-3 rounded-3xl border border-border bg-card px-3 py-2">
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
          {mirror ? <p className="truncate text-xs text-muted-foreground">Hearing your own voice</p> : null}
        </div>
        <ol className="hidden gap-1 sm:flex" aria-label="Progress">
          {acts.map((act) => {
            const done =
              thread.actsCompleted.includes(act.id) ||
              (act.id === "talk" && said > 0) ||
              (act.id === "mirror" && mirrorReplies > 0);
            const current = thread.act === act.id || (act.id === "talk" && thread.act === "repair");
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
        {finished && thread.feedback ? (
          <FeedbackView key={thread.id} feedback={thread.feedback} name={scene.character.name} onAgain={() => void restart()} onHome={home} />
        ) : (
          <>
            <p className="bubble-in max-w-md text-sm leading-6 text-stage-foreground/75">{scene.premise}</p>
            {transcript.map((message) => (
              <Bubble key={message.id} role={message.role} text={message.text} name={scene.character.name} mirror={mirror} />
            ))}
            {offerFeedback ? (
              <div className="bubble-in mr-auto max-w-[85%]">
                <p className="px-2 text-[0.65rem] uppercase tracking-[0.14em] text-stage-foreground/60">MIRROR</p>
                <div className="mt-1 rounded-3xl rounded-bl-md border border-white/15 bg-white/10 px-4 py-3 text-stage-foreground">
                  <p>
                    {thread.stalled
                      ? `${scene.character.name} has stepped back from this one.`
                      : "You've heard how it sounds from the other side."}{" "}
                    You can keep going, or stop here and get detailed feedback on every response you gave.
                  </p>
                  <Button type="button" variant="accent" size="sm" className="mt-3" disabled={busy} onClick={() => void askFeedback()}>
                    Stop and get feedback
                  </Button>
                </div>
              </div>
            ) : null}
            {busy ? <Typing name={reviewing ? "MIRROR is reviewing your responses" : mirror ? "You, from the other chair" : scene.character.name} /> : null}
          </>
        )}
      </div>

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      {!finished ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          {showSwitch ? (
            <div className="relative">
              <div role="status" className="nudge-float pointer-events-none absolute bottom-full left-0 mb-3 w-60 rounded-2xl bg-moss px-3 py-2 text-sm leading-5 text-white shadow-lg">
                Curious how that sounded to {scene.character.name}? Switch seats and hear it from their side.
                <span aria-hidden="true" className="absolute -bottom-1.5 left-6 size-3 rotate-45 bg-moss" />
              </div>
              <Button
                type="button"
                size="sm"
                variant="moss"
                onClick={() => void run(() => postJson("/api/act", { threadId: thread.id, act: "mirror", thread }))}
              >
                Switch perspective
              </Button>
            </div>
          ) : null}
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void restart()}>
            New chat
          </Button>
        </div>
      ) : null}

      {canType ? (
        <form onSubmit={(event) => void send(event)} className="mt-3 flex items-end gap-2">
          <label className="sr-only" htmlFor="line">
            Message
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
            placeholder={mirror ? `Reply as ${scene.character.name}…` : `Message ${scene.character.name}…`}
            className="min-h-14 flex-1 resize-none rounded-3xl border border-border bg-card px-4 py-3 text-base outline-none"
          />
          <Button type="submit" variant="accent" disabled={busy || !draft.trim()} className="h-12">
            Send
          </Button>
        </form>
      ) : null}
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
