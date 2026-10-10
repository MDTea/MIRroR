"use client";

import { useEffect, useState } from "react";
import { postJson } from "@/lib/status";
import type { Thread } from "@/lib/types";
import { cn } from "@/lib/utils";

const thinking = [
  "Reading what you wrote…",
  "Figuring out who they are…",
  "Writing their side of it…",
  "Finding what they haven't said yet…",
];

export function ScenarioComposer({ onReady }: { onReady: (thread: Thread) => void }) {
  const [problem, setProblem] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(() => setStep((value) => (value + 1) % thinking.length), 1600);
    return () => window.clearInterval(id);
  }, [busy]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = problem.trim();
    if (!text || busy) return;
    setSent(text);
    setProblem("");
    setStep(0);
    setError("");
    setBusy(true);
    try {
      const data = await postJson<{ thread: Thread }>("/api/custom", { problem: text });
      onReady(data.thread);
    } catch (submitError) {
      setProblem(text);
      setError(submitError instanceof Error ? submitError.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="own-title" className="mt-10 rounded-[2rem] border border-border bg-card/85 p-4 shadow-sm backdrop-blur-sm sm:p-6">
      <h2 id="own-title" className="font-display text-3xl">
        Practice your own conversation
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Describe the situation. Who is it with, what happened, and what do you want from talking to them? I&apos;ll build the other person and you can practice with them.
      </p>

      {sent && (busy || error) ? (
        <div className="mt-5 flex flex-col gap-3">
          <p className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-md bg-accent px-4 py-3 text-accent-foreground">{sent}</p>
          {busy ? (
            <div className="mr-auto flex items-center gap-3 rounded-3xl rounded-bl-md bg-secondary px-4 py-3" aria-live="polite">
              <span className="flex gap-1" aria-hidden="true">
                <span className="typing-dot size-2 rounded-full bg-foreground" />
                <span className="typing-dot size-2 rounded-full bg-foreground [animation-delay:150ms]" />
                <span className="typing-dot size-2 rounded-full bg-foreground [animation-delay:300ms]" />
              </span>
              <span key={step} className="bubble-in text-sm text-muted-foreground">
                {thinking[step]}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <form onSubmit={(event) => void submit(event)} className="mt-5">
        <label htmlFor="problem" className="sr-only">
          Describe your situation
        </label>
        <div className="relative rounded-[1.6rem] border border-border bg-background/80 focus-within:ring-2 focus-within:ring-ring">
          <textarea
            id="problem"
            value={problem}
            disabled={busy}
            rows={7}
            maxLength={2000}
            onChange={(event) => setProblem(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="e.g. My roommate keeps having friends over late on weeknights. I've hinted twice and it hasn't changed. I want to bring it up without it turning into a fight."
            className="block min-h-48 w-full resize-y rounded-[1.6rem] bg-transparent px-5 pb-16 pt-4 text-base leading-7 outline-none placeholder:text-muted-foreground/70"
          />
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
            <span className="pl-2 text-xs text-muted-foreground">Enter to send · Shift+Enter for a new line</span>
            <button
              type="submit"
              disabled={busy || problem.trim().length < 12}
              title={problem.trim().length < 12 ? "Write at least a sentence" : undefined}
              aria-label="Create scenario"
              className={cn(
                "flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity",
                "disabled:opacity-30",
              )}
            >
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
