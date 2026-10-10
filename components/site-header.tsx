"use client";

import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function SiteHeader() {
  return (
    <header className="z-30 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center px-4 py-3">
        <Link href="/" className="font-display text-3xl tracking-tight text-foreground">
          <Wordmark />
        </Link>
      </div>
    </header>
  );
}
