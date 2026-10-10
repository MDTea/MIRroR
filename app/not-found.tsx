import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Off the callboard</p>
      <h1 className="mt-3 font-display text-5xl">That scene is not in the hall.</h1>
      <Button asChild className="mt-6">
        <Link href="/">Return to the hall</Link>
      </Button>
    </main>
  );
}
