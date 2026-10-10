"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Portrait } from "@/components/portrait";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { expressionFor, lampWords, sceneCanRest } from "@/lib/engine";
import { getScene } from "@/lib/scenes";
import { postJson } from "@/lib/status";
import type { Thread } from "@/lib/types";

export function StageApp({ slug }: { slug: string }) {
  const scene = getScene(slug);
  const router = useRouter();
  const [requestedId, setRequestedId] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);
  const [queryReady, setQueryReady] = useState(false);
  const [thread, setThread] = useState<Thread | null>(null);
  const [phase, setPhase] = useState<"loading" | "prologue" | "live">("loading");
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [announce, setAnnounce] = useState("");
  const [shardOpen, setShardOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRequestedId(params.get("thread"));
    setFresh(params.get("fresh") === "1");
    setQueryReady(true);
  }, [slug]);

  useEffect(() => {
    if (!queryReady) return;
    let ignore = false;
    async function load() {
      if (fresh) {
        setThread(null);
        setPhase("prologue");
        return;
      }
      setPhase((current) => (current === "live" ? current : "loading"));
      setError("");
      try {
        const response = await fetch("/api/threads");
        const data = (await response.json()) as { threads?: Thread[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Could not load showings.");
        if (ignore) return;
        const rows = (data.threads ?? []).filter((item) => item.slug === slug);
        const found = requestedId ? rows.find((item) => item.id === requestedId) : rows[0];
        if (requestedId && !found) {
          setError("That showing is not on this machine.");
          setPhase("prologue");
          return;
        }
        if (found) {
          setThread(found);
          setPhase("live");
        } else {
          setThread(null);
          setPhase("prologue");
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Could not load the scene.");
          setPhase("prologue");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [fresh, queryReady, requestedId, slug]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [thread?.messages.length, thread?.mirrorMessages.length, thread?.act]);

  const said = thread?.messages.filter((message) => message.role === "user").length ?? 0;
  const expression = thread ? expressionFor(thread.state, thread.stalled) : "guarded";
  const lamps = thread ? lampWords(thread.state) : [];
  const resting = thread ? sceneCanRest(thread.state) : false;
  const notesReady = useMemo(
    () => Boolean(thread && thread.reflection.length === 3 && thread.reflection.every((item) => (notes[item.id] ?? "").trim())),
    [notes, thread],
  );

  if (!scene) return null;

  async function apply(next: Thread, previousShards = 0) {
    setThread(next);
    setPhase("live");
    if (next.shards.length > previousShards) setShardOpen(true);
    const last = (next.act === "mirror" ? next.mirrorMessages : next.messages).at(-1);
    if (last) setAnnounce(`${last.role === "user" ? "You" : scene?.character.name}: ${last.text}`);
  }

  async function run(task: () => Promise<{ thread: Thread }>, previousShards = thread?.shards.length ?? 0) {
    setBusy(true);
    setError("");
    try {
      const data = await task();
      await apply(data.thread, previousShards);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "That beat failed.");
    } finally {
      setBusy(false);
    }
  }

  async function enter() {
    const data = await postJson<{ thread: Thread }>("/api/threads", { slug });
    router.replace(`/scene/${slug}?thread=${data.thread.id}`);
    return data;
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!thread || !draft.trim()) return;
    const text = draft.trim();
    const mode = thread.act === "mirror" ? "mirror" : thread.act === "repair" ? "repair" : "talk";
    setDraft("");
    await run(() => postJson("/api/turn", { threadId: thread.id, text, mode }));
    box.current?.focus();
  }

  const transcript = thread?.act === "mirror" ? thread.mirrorMessages : thread?.messages ?? [];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[18rem_1fr] lg:px-6">
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <aside className="rounded-3xl border border-border bg-card p-4 lg:sticky lg:top-24 lg:self-start">
        <Portrait slug={scene.slug} name={scene.character.name} expression={expression} mirrored={thread?.act === "mirror"} className="mx-auto h-56 w-48" />
        <h1 className="mt-3 font-display text-3xl">{scene.title}</h1>
        <p className="text-sm text-muted-foreground">
          {scene.character.name} · {scene.character.pronouns}
        </p>
        <p className="mt-3 text-sm leading-6">{scene.character.aim}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{scene.character.boundary}</p>
        {thread && thread.act !== "mirror" ? (
          <div className="mt-4">
            <h2 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">What you can&apos;t fully see</h2>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {lamps.map((lamp) => (
                <li key={lamp.id} className="rounded-2xl bg-secondary px-3 py-2">
                  <span className="block text-[0.65rem] uppercase tracking-wide text-muted-foreground">{lamp.label}</span>
                  <span className="font-display text-lg">{lamp.word}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : thread?.act === "mirror" ? (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">The gauges stay in the room you left. This chair does not come with a score.</p>
        ) : (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Once the curtain is up, the room is described in words. None of them is a score.</p>
        )}
      </aside>

      <section
        className={
          phase === "live" && thread?.act !== "reflect"
            ? "stage-wash flex min-h-[70dvh] flex-col rounded-[2rem] p-4 sm:p-6"
            : "flex min-h-[70dvh] flex-col rounded-[2rem] border border-border bg-card p-4 text-foreground sm:p-6"
        }
        data-mood={expression}
        data-mode={thread?.act === "mirror" ? "mirror" : "scene"}
      >
        {phase === "loading" ? <p className="m-auto text-sm">Raising the curtain…</p> : null}

        {phase === "prologue" ? (
          <div className="m-auto max-w-xl">
            <Badge variant="accent">Before the curtain</Badge>
            <h2 className="mt-4 font-display text-5xl leading-none text-foreground">A usual assistant would take your side.</h2>
            <blockquote className="mt-5 rounded-3xl bg-secondary p-5 text-lg leading-8 text-foreground">
              “{scene.agreeable}”
            </blockquote>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              That shape of reply — agree, exonerate, move on — is the thing this room refuses. Cheng et al. (2026) found sycophantic replies can increase the feeling of being right and reduce intentions to repair.
            </p>
            <div className="mt-5 rounded-3xl border border-border p-5">
              <h3 className="font-display text-2xl">The actual scene</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{scene.premise}</p>
              <p className="mt-3 text-sm leading-6">
                <span className="font-medium">Setting. </span>
                {scene.setting}
              </p>
            </div>
            {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
            <Button className="mt-5" size="lg" onClick={() => void run(enter)} disabled={busy}>
              Raise the real curtain
            </Button>
          </div>
        ) : null}

        {phase === "live" && thread ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={thread.act === "reflect" ? "default" : "stage"}>
                {thread.act === "mirror" ? "Other chair" : thread.act === "repair" ? "Second showing" : thread.act === "reflect" ? "Notes" : "Scene"}
              </Badge>
              <span className={thread.act === "reflect" ? "text-xs text-muted-foreground" : "text-xs text-stage-foreground/70"}>
                {thread.voice === "live" ? "Improvising" : "House script"}
              </span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={thread.act === "reflect" ? "outline" : "stage"} disabled={said < 2 || busy} onClick={() => void run(() => postJson("/api/act", { threadId: thread.id, act: "mirror" }))}>
                  Switch perspective
                </Button>
                {thread.act === "mirror" ? (
                  <Button type="button" size="sm" variant="stage" disabled={busy} onClick={() => void run(() => postJson("/api/act", { threadId: thread.id, act: "talk" }))}>
                    Return to your chair
                  </Button>
                ) : null}
                <Button type="button" size="sm" variant={thread.act === "reflect" ? "outline" : "stage"} disabled={said < 1 || busy} onClick={() => void run(() => postJson("/api/act", { threadId: thread.id, act: "reflect" }))}>
                  Notes
                </Button>
                <Button type="button" size="sm" variant={thread.act === "reflect" ? "default" : "stage"} disabled={!thread.actsCompleted.includes("reflect") || busy} onClick={() => void run(() => postJson("/api/act", { threadId: thread.id, act: "repair" }))}>
                  Repair
                </Button>
              </div>
            </div>

            {thread.act === "mirror" ? (
              <p className="mt-4 font-display text-3xl leading-tight">
                You are {scene.character.name}. The person across from you speaks in your patterns.
              </p>
            ) : null}

            <div ref={scroller} className="mt-4 flex max-h-[46dvh] flex-1 flex-col gap-3 overflow-y-auto pr-1" tabIndex={0} aria-label="Transcript">
              {transcript.map((message) => (
                <TranscriptLine
                  key={message.id}
                  role={message.role}
                  text={message.text}
                  name={scene.character.name}
                  paper={thread.act === "reflect"}
                  mirror={thread.act === "mirror"}
                />
              ))}
            </div>

            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            {resting && thread.act !== "mirror" && thread.act !== "reflect" ? (
              <p className="mt-3 text-sm text-stage-foreground/80">The room has eased. Nothing was scored. You can file the notes, or stay.</p>
            ) : null}

            {thread.act === "reflect" ? (
              <form
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!notesReady) return;
                  void run(() =>
                    postJson("/api/reflect", {
                      threadId: thread.id,
                      answers: thread.reflection.map((item) => ({ id: item.id, answer: notes[item.id] ?? "" })),
                    }),
                  );
                }}
              >
                {thread.turningPoint ? (
                  <blockquote className="rounded-3xl bg-secondary p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{thread.turningPoint.note}</p>
                    <p className="mt-2 font-display text-2xl leading-snug">“{thread.turningPoint.quote}”</p>
                  </blockquote>
                ) : null}
                {thread.reflection.map((item) => (
                  <label key={item.id} className="block text-sm leading-6">
                    {item.question}
                    <Textarea
                      className="mt-2"
                      value={notes[item.id] ?? ""}
                      onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                      required
                    />
                  </label>
                ))}
                <Button type="submit" disabled={!notesReady || busy}>
                  File the notes
                </Button>
                {thread.actsCompleted.includes("reflect") ? (
                  <p className="text-sm text-muted-foreground">Filed. Repair is open whenever you want the second showing.</p>
                ) : null}
              </form>
            ) : thread.stalled ? (
              <div className="mt-4 rounded-3xl border border-white/15 p-4">
                <p>They have stepped back. You can sit in their chair, or file the notes. The scene will not keep absorbing this.</p>
              </div>
            ) : (
              <form onSubmit={(event) => void send(event)} className="mt-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  {scene.cues.map((cue) => (
                    <button
                      key={cue.id}
                      type="button"
                      className="rounded-full border border-white/15 px-3 py-1 text-xs text-stage-foreground/80 hover:bg-white/10"
                      onClick={() => {
                        setDraft((current) => (current.trim() ? `${current.trim()} ${cue.text}` : cue.text));
                        box.current?.focus();
                      }}
                    >
                      Cue: {cue.label}
                    </button>
                  ))}
                </div>
                <label className="block text-sm" htmlFor="line">
                  {thread.act === "mirror" ? `Answer as ${scene.character.name}` : "Your line"}
                </label>
                <Textarea
                  id="line"
                  ref={box}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder={thread.act === "mirror" ? "Speak as them. There is no correct line." : "Say it in your own words. Enter sends. Shift+Enter starts a new line."}
                  className="mt-2 border-white/15 bg-white/5 text-stage-foreground placeholder:text-stage-foreground/45"
                  disabled={busy}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="submit" variant="accent" disabled={busy || !draft.trim()}>
                    {busy ? "The room takes that in…" : "Say it"}
                  </Button>
                  {thread.act !== "mirror" ? (
                    <Button type="button" variant="stage" disabled={busy} onClick={() => void run(() => postJson("/api/pause", { threadId: thread.id }))}>
                      Hold a beat
                    </Button>
                  ) : null}
                  <Button type="button" variant="stage" onClick={() => setConfirmNew(true)}>
                    New showing
                  </Button>
                  <Button asChild variant="ghost" className="text-stage-foreground hover:bg-white/10">
                    <Link href="/journal">Journal</Link>
                  </Button>
                </div>
              </form>
            )}
          </>
        ) : null}
      </section>

      <Dialog open={shardOpen} onOpenChange={setShardOpen}>
        <DialogContent title="A shard, not a score">
          <p>
            You sat in the other chair long enough to hear a version of your own voice. The shard only marks that. It does not grade you.
          </p>
          <DialogClose className="mt-4 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
            Back to the scene
          </DialogClose>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmNew} onOpenChange={setConfirmNew}>
        <DialogContent title="Start a new showing?">
          <p>The old one stays in the journal, memory included. This one begins at the top of the scene.</p>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              onClick={() => {
                setConfirmNew(false);
                router.replace(`/scene/${slug}?fresh=1`);
                setThread(null);
                setPhase("prologue");
              }}
            >
              New showing
            </Button>
            <DialogClose className="rounded-full border border-border px-4 py-2 text-sm">Keep this one</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TranscriptLine({
  role,
  text,
  name,
  paper,
  mirror,
}: {
  role: string;
  text: string;
  name: string;
  paper: boolean;
  mirror: boolean;
}) {
  if (role === "stage") {
    return <p className={paper ? "px-2 text-sm italic text-muted-foreground" : "px-2 text-sm italic text-stage-foreground/75"}>{text}</p>;
  }
  const mine = role === "user";
  const label = role === "mirror-self" ? "You, from the other chair" : mine && mirror ? `${name} (you)` : mine ? "You" : name;
  return (
    <div className={mine ? "ml-8" : "mr-8"}>
      <p className={paper ? "text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground" : "text-[0.65rem] uppercase tracking-[0.14em] text-stage-foreground/60"}>
        {label}
      </p>
      <p className={mine ? "mt-1 rounded-3xl rounded-tr-md bg-accent px-4 py-3 text-accent-foreground" : paper ? "mt-1 rounded-3xl rounded-tl-md bg-secondary px-4 py-3" : "mt-1 rounded-3xl rounded-tl-md bg-white/10 px-4 py-3"}>
        {text}
      </p>
    </div>
  );
}
