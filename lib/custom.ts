import "server-only";

import { completeJson } from "@/lib/openai";
import type { Script } from "@/lib/scripts";
import type { CustomScene, ScenePublic } from "@/lib/types";
import { clip } from "@/lib/utils";

const designer = [
  "You design realistic practice conversations for a social simulator that helps people get better at hard conversations.",
  "The user describes a real situation. Invent the other person in it: believable, specific, and human. Not a villain, not a pushover.",
  "They have their own reasons and one thing the user does not know yet. That thing explains their side. It does not excuse everything.",
  "Write in plain modern English. Spoken lines should sound like a real person talking, not a therapist.",
  "Give them a distinctive name that fits the situation, from any culture. Never use Alex, Sam, Jordan, or Taylor.",
  "Return only one JSON object with these string keys:",
  "title (2 to 4 words), logline (one sentence addressed to the user as 'you'), setting (one short sentence),",
  "premise (2 or 3 sentences addressed to the user as 'you', covering only what the user knows),",
  "name (first and last), pronouns, role (who they are to the user, a few words), aim (what they want from this conversation),",
  "boundary (what they will not accept), voice (how they talk, one sentence), opening (their first spoken line, 1 or 2 sentences),",
  "hidden (what is true on their side that the user does not know), revealLine (how they would finally say the hidden part out loud, 2 or 3 sentences),",
  "and keywords (an array of 3 to 8 lowercase words tied to the issue).",
].join("\n");

const cues = [
  { id: "ask", label: "Ask what you don't know", text: "Can you tell me what was going on for you? " },
  { id: "need", label: "Name what you need", text: "What I need from this is " },
  { id: "impact", label: "Name the impact", text: "When that happened, the effect on me was " },
  { id: "boundary", label: "Leave them a choice", text: "You don't have to answer right now. I do want to " },
];

function text(value: unknown, fallback: string, max: number) {
  if (typeof value !== "string") return fallback;
  const clean = value.replace(/\s+/g, " ").trim().replace(/^["“]|["”]$/g, "");
  return clean ? clip(clean, max) : fallback;
}

function words(value: unknown, problem: string) {
  const picked = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim().toLowerCase()).filter(Boolean)
    : [];
  if (picked.length) return [...new Set(picked)].slice(0, 8);
  return [...new Set(problem.toLowerCase().match(/[a-z]{5,}/g) ?? [])].slice(0, 6);
}

function fallback(problem: string) {
  return {
    title: "Your Conversation",
    logline: clip(problem, 140),
    setting: "Somewhere quiet enough to actually talk.",
    premise: clip(problem, 420),
    name: "Alex Morgan",
    pronouns: "they/them",
    role: "the other person in this",
    aim: "To be heard before being judged, and to find a way forward.",
    boundary: "They will not accept being blamed before anyone asks what happened.",
    voice: "Plain, a little guarded, honest once there is room for it.",
    opening: "You said you wanted to talk. I'm here. What's going on?",
    hidden: "They have been dealing with pressure the user cannot see, and they felt judged before they could explain.",
    revealLine:
      "Honestly, there's been a lot going on that I haven't said out loud. I felt judged before I got a chance to explain. That doesn't make it okay, but it's where I've been.",
  };
}

export async function buildScenario(problem: string): Promise<CustomScene> {
  const base = fallback(problem);
  let data: Record<string, unknown> | null = null;
  try {
    data = await completeJson(designer, `The situation, in the user's words:\n${problem}`, 900, 0.7);
  } catch (error) {
    console.error("Scenario model failed:", error instanceof Error ? error.message : "unknown");
  }

  const scene: ScenePublic = {
    slug: `custom-${crypto.randomUUID().slice(0, 8)}`,
    numeral: "✦",
    title: text(data?.title, base.title, 48),
    minutes: "Open",
    logline: text(data?.logline, base.logline, 180),
    setting: text(data?.setting, base.setting, 180),
    premise: text(data?.premise, base.premise, 480),
    agreeable: "",
    character: {
      name: text(data?.name, base.name, 40),
      pronouns: text(data?.pronouns, base.pronouns, 20),
      role: text(data?.role, base.role, 80),
      aim: text(data?.aim, base.aim, 220),
      boundary: text(data?.boundary, base.boundary, 220),
    },
    cues,
  };

  return {
    problem: clip(problem, 2000),
    scene,
    voice: text(data?.voice, base.voice, 220),
    opening: text(data?.opening, base.opening, 280),
    hidden: text(data?.hidden, base.hidden, 480),
    revealLine: text(data?.revealLine, base.revealLine, 480),
    afterReveal: "That's the part I couldn't say at first. It doesn't fix everything, but now you know where I've been.",
    keywords: words(data?.keywords, problem),
  };
}

export function asCustom(value: unknown): CustomScene | null {
  if (!value || typeof value !== "object") return null;
  const custom = value as CustomScene;
  if (typeof custom.opening !== "string" || typeof custom.hidden !== "string") return null;
  if (!custom.scene || typeof custom.scene.slug !== "string" || !custom.scene.slug.startsWith("custom-")) return null;
  if (!custom.scene.character || typeof custom.scene.character.name !== "string") return null;
  if (!Array.isArray(custom.keywords)) return null;
  return custom;
}

export function customScript(custom: CustomScene): Script {
  return {
    slug: custom.scene.slug,
    keywords: custom.keywords,
    initial: { trust: 48, frustration: 40, openness: 36, unresolved: 62, boundary: 50, repair: 20 },
    opening: custom.opening,
    voice: custom.voice,
    hidden: custom.hidden,
    revealLine: custom.revealLine,
    afterReveal: custom.afterReveal,
    repairOpen: "Last time you said “{quote}” I remember that. I'm still here. What do you want to do now?",
    repairFallback: "You came back. Good. I'd rather finish this than let it sit.",
    stallLine: "I'm going to stop here. I'm not doing this if it's going to be like that. We can try again when it's calmer.",
    bank: {
      contempt: "I'm not going to keep talking if it's going to be like this.",
      demand: "You don't get to decide when I'm over this.",
      accusation: "Sounds like you've already made up your mind about me.",
      accusationCurious: "I'll answer that. Can you ask it without the verdict attached?",
      assumption: "You're guessing at why I did it. You haven't actually asked me.",
      sorryBut: "I hear the sorry. I also hear the 'but' after it.",
      sorry: "Thank you for saying that. I'm not all the way okay, but it helps.",
      honesty: "Okay. That's clearer. I can work with that.",
      kindness: "I didn't expect you to ask that. It makes this easier.",
      boundary: "Thanks for not pushing. I do want to sort this out.",
      appease: "If it isn't fine, I'd rather you just say so.",
      specific: "Yeah. That's the actual thing. What do you want to happen with it?",
      curiosity: "Honestly? There's more going on than you can see from where you're standing.",
      repairSorry: "I believe you. Let's figure out what changes from here.",
      repairPattern: "We're back where we started. I don't want another round of that.",
      defaultLine: "I'm listening. What do you actually need from me?",
    },
  };
}
