"use client";

import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function SiteHeader() {
  return (
    <header className="relative z-30 border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="flex w-full items-center justify-start px-4 py-3">
        <Link
          href="/"
          aria-label="Home"
          className="inline-flex items-center rounded-full px-2 py-1 font-display text-3xl tracking-tight text-foreground hover:bg-secondary"
          onClick={() => {
            window.dispatchEvent(new Event("mirror-home"));
          }}
        >
          <Wordmark />
        </Link>
      </div>
    </header>
  );
}
