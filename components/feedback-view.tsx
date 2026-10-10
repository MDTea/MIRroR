"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Feedback } from "@/lib/types";

export function FeedbackView({
  feedback,
  name,
  onAgain,
  onHome,
}: {
  feedback: Feedback;
  name: string;
  onAgain: () => void;
  onHome: () => void;
}) {
  const [shown, setShown] = useState(0);
  const end = useRef<HTMLDivElement>(null);
  const total = feedback.responses.length;
  const done = shown >= total;

  useEffect(() => {
    if (shown === 0) return;
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [shown]);

  return (
    <div className="flex flex-col gap-4">
      <section className="bubble-in rounded-3xl border border-border bg-card p-5 text-foreground">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your feedback</p>
        <p className="mt-2 text-base leading-7">{feedback.summary}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Points title="What worked" items={feedback.pros} tone="pro" />
          <Points title="What to work on" items={feedback.cons} tone="con" />
        </div>
      </section>

      {feedback.responses.slice(0, shown).map((item, index) => (
        <section key={item.messageId} className="bubble-in rounded-3xl border border-border bg-card p-5 text-foreground">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Response {index + 1} of {total}
          </p>
          <blockquote className="mt-2 rounded-2xl bg-accent/25 px-4 py-3 text-base leading-7">“{item.text}”</blockquote>
          {item.reply ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">{name}:</span> {item.reply}
            </p>
          ) : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Points title="Pros" items={item.pros} tone="pro" />
            <Points title="Cons" items={item.cons.length ? item.cons : ["Nothing major here."]} tone="con" />
          </div>
          <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm leading-6">
            <span className="font-medium">Try instead: </span>
            {item.tryInstead}
          </p>
        </section>
      ))}

      {done ? (
        <section className="bubble-in rounded-3xl border border-moss/30 bg-moss p-6 text-center text-white">
          <p className="font-display text-3xl leading-tight">You have successfully completed this scenario.</p>
          <p className="mt-2 text-sm text-white/80">Every line you wrote is above. Try it again and see what changes.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="accent" onClick={onAgain}>
              Try it again
            </Button>
            <Button type="button" variant="outline" onClick={onHome}>
              Pick another conversation
            </Button>
          </div>
        </section>
      ) : (
        <div className="flex justify-center">
          <Button type="button" variant="accent" size="lg" onClick={() => setShown((value) => value + 1)}>
            {shown === 0 ? "See your first response" : `Next: response ${shown + 1} of ${total}`}
          </Button>
        </div>
      )}
      <div ref={end} />
    </div>
  );
}

function Points({ title, items, tone }: { title: string; items: string[]; tone: "pro" | "con" }) {
  return (
    <div>
      <p className={tone === "pro" ? "text-sm font-medium text-moss" : "text-sm font-medium text-destructive"}>{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6">
            <span aria-hidden="true" className={tone === "pro" ? "text-moss" : "text-destructive"}>
              {tone === "pro" ? "+" : "–"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
