import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MIRROR — Practice being human",
    template: "%s · MIRROR",
  },
  description:
    "A social simulator where you practice difficult conversations, hear your own words from the other chair, and come back to repair what went wrong.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`} data-scroll-behavior="smooth">
      <body className="flex h-dvh flex-col overflow-hidden font-sans text-foreground antialiased">
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <Suspense fallback={<div className="h-16 border-b border-border" />}>
          <SiteHeader />
        </Suspense>
        <div id="content" className="min-h-0 flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
