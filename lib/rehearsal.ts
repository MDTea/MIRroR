import "server-only";

import {
  applyPause,
  charge,
  detectSignals,
  emptySignals,
  expressionFor,
  isStalled,
  mirrorFallback,
  pickTurningPoint,
  postureLine,
  reflectionQuestions,
  styleProfile,
  step,
} from "@/lib/engine";
import { getClient, modelName } from "@/lib/openai";
import { characterSystem, mirrorSystem, sanitizeLine } from "@/lib/prompts";
import { getScene } from "@/lib/scenes";
import { getScript, repairOpening, scriptedLine } from "@/lib/scripts";
import { HttpError } from "@/lib/schemas";
import { asThread, createThread as persistThread, getThread, listThreads, saveThread } from "@/lib/store";
import type { Act, Message, Thread, Voice } from "@/lib/types";

function now() {
  return new Date().toISOString();
}

function message(partial: Omit<Message, "id" | "at"> & { id?: string }): Message {
  return {
    id: partial.id ?? crypto.randomUUID(),
    at: now(),
    role: partial.role,
    text: partial.text,
    signals: partial.signals,
    delta: partial.delta,
    voice: partial.voice,
  };
}

function mark(thread: Thread, act: Act) {
  if (!thread.actsCompleted.includes(act)) thread.actsCompleted.push(act);
}

async function complete(system: string, history: { role: "user" | "assistant"; content: string }[]) {
  const client = getClient();
  if (!client) return null;
  const response = await client.chat.completions.create({
    model: modelName(),
    temperature: 0.8,
    messages: [{ role: "system", content: system }, ...history],
  });
  return sanitizeLine(response.choices[0]?.message?.content ?? "");
}

function spokenHistory(messages: Message[], userRole: "user" | "character" | "mirror-self" = "user") {
  return messages
    .filter((item) => item.role === "user" || item.role === "character" || item.role === "mirror-self")
    .slice(-12)
    .map((item) => ({
      role: item.role === userRole ? ("user" as const) : ("assistant" as const),
      content: item.text,
    }));
}

export async function listShowings() {
  return listThreads();
}

async function takeThread(id: string, snapshot: unknown) {
  const stored = await getThread(id);
  if (stored) return stored;
  const carried = asThread(snapshot);
  if (!carried || carried.id !== id) return null;
  if (!getScene(carried.slug) || !getScript(carried.slug)) return null;
  return carried;
}

export async function readShowing(id: string) {
  const thread = await getThread(id);
  if (!thread) throw new HttpError("That showing could not be found.", 404);
  return thread;
}

export async function openShowing(slug: string) {
  const scene = getScene(slug);
  const script = getScript(slug);
  if (!scene || !script) throw new HttpError("That scene is not on the callboard.", 404);
  const thread: Thread = {
    id: crypto.randomUUID(),
    slug,
    act: "talk",
    state: { ...script.initial },
    messages: [message({ role: "character", text: script.opening, voice: "house" })],
    mirrorMessages: [],
    totals: emptySignals(),
    revealed: false,
    events: [],
    turningPoint: null,
    reflection: [],
    shards: [],
    actsCompleted: [],
    repairVisits: 0,
    stalled: false,
    sharpest: "",
    voice: "house",
    createdAt: now(),
    updatedAt: now(),
  };
  return persistThread(thread);
}

export async function speak(threadId: string, text: string, mode: "talk" | "mirror" | "repair", snapshot?: unknown) {
  const thread = await takeThread(threadId, snapshot);
  if (!thread) throw new HttpError("That showing could not be found.", 404);
  const scene = getScene(thread.slug);
  const script = getScript(thread.slug);
  if (!scene || !script) throw new HttpError("That scene is missing its script.", 500);

  if (mode === "mirror") {
    if (thread.act !== "mirror") throw new HttpError("Sit in the other chair before you answer as them.");
    const profile = styleProfile(
      thread.messages.filter((item) => item.role === "user").map((item) => item.text),
      script.keywords,
    );
    thread.mirrorMessages.push(message({ role: "user", text }));
    const turnIndex = thread.mirrorMessages.filter((item) => item.role === "mirror-self").length;
    let line = "";
    let voice: Voice = "house";
    try {
      line =
        (await complete(mirrorSystem(scene, profile), [
          ...spokenHistory(thread.mirrorMessages, "user").slice(0, -1),
          { role: "user", content: text },
        ])) ?? "";
    } catch (error) {
      console.error("Mirror model failed:", error instanceof Error ? error.message : "unknown");
    }
    if (!line) line = mirrorFallback(profile, turnIndex);
    else voice = "live";
    thread.mirrorMessages.push(message({ role: "mirror-self", text: line, voice }));
    thread.voice = voice;
    const replies = thread.mirrorMessages.filter((item) => item.role === "user").length;
    if (replies >= 2) {
      mark(thread, "mirror");
      if (!thread.shards.includes(thread.slug)) thread.shards.push(thread.slug);
    }
    return saveThread(thread);
  }

  if (thread.stalled) {
    throw new HttpError("This showing has stopped. Switch chairs, or file the notes.");
  }
  if (mode === "repair" && thread.act !== "repair") {
    throw new HttpError("Repair opens after the notes are filed.");
  }
  if (mode === "talk" && thread.act !== "talk") {
    throw new HttpError("Return to your own chair before you add another line.");
  }

  const signals = detectSignals(text, script.keywords);
  const before = expressionFor(thread.state, thread.stalled);
  const result = step({
    state: thread.state,
    signals,
    totals: thread.totals,
    revealed: thread.revealed,
    mode: mode === "repair" ? "repair" : "talk",
  });
  thread.state = result.state;
  thread.totals = result.totals;
  if (charge(signals) >= charge(detectSignals(thread.sharpest, script.keywords)) && text.trim()) {
    thread.sharpest = text.trim();
  }
  thread.messages.push(message({ role: "user", text, signals, delta: result.delta }));
  if (result.justRevealed) {
    thread.revealed = true;
    thread.events.push({
      id: crypto.randomUUID(),
      label: "Context",
      detail: "They told you something you could not have seen at the start.",
    });
  }
  if (signals.apology && !signals.justification) {
    thread.events.push({
      id: crypto.randomUUID(),
      label: "Account",
      detail: "An apology arrived without a defense attached.",
    });
  }
  thread.stalled = isStalled(thread.state, thread.totals);
  const after = expressionFor(thread.state, thread.stalled);

  let line = "";
  let voice: Voice = "house";
  const authored = result.justRevealed || thread.stalled;
  if (!authored) {
    try {
      const history = spokenHistory(thread.messages, "user");
      line =
        (await complete(characterSystem(scene, script, thread, result.justRevealed), history)) ?? "";
    } catch (error) {
      console.error("Scene model failed:", error instanceof Error ? error.message : "unknown");
    }
  }
  if (!line) {
    line = scriptedLine(script, {
      signals,
      revealed: thread.revealed,
      justRevealed: result.justRevealed,
      repair: mode === "repair",
      stalled: thread.stalled,
      prior: thread.messages.filter((item) => item.role === "character").map((item) => item.text),
    });
  } else {
    voice = "live";
  }
  thread.voice = voice;
  thread.messages.push(message({ role: "character", text: line, voice }));
  const caption =
    result.caption ?? (before !== after ? postureLine(after) : null);
  if (caption) thread.messages.push(message({ role: "stage", text: caption }));
  thread.turningPoint = pickTurningPoint(thread.messages);
  if (mode === "repair") mark(thread, "repair");
  else if (thread.messages.some((item) => item.role === "user")) mark(thread, "talk");
  return saveThread(thread);
}

export async function holdBeat(threadId: string, snapshot?: unknown) {
  const thread = await takeThread(threadId, snapshot);
  if (!thread) throw new HttpError("That showing could not be found.", 404);
  if (thread.act === "mirror") throw new HttpError("A beat belongs to the original chairs.");
  if (thread.stalled) throw new HttpError("The scene has already stopped.");
  const before = expressionFor(thread.state, thread.stalled);
  const paused = applyPause(thread.state);
  thread.state = paused.state;
  thread.stalled = isStalled(thread.state, thread.totals);
  const after = expressionFor(thread.state, thread.stalled);
  thread.messages.push(message({ role: "stage", text: paused.caption }));
  if (before !== after) {
    thread.messages.push(message({ role: "stage", text: postureLine(after) }));
  }
  return saveThread(thread);
}

export async function changeAct(threadId: string, act: "mirror" | "repair" | "reflect" | "talk", snapshot?: unknown) {
  const thread = await takeThread(threadId, snapshot);
  if (!thread) throw new HttpError("That showing could not be found.", 404);
  const scene = getScene(thread.slug);
  const script = getScript(thread.slug);
  if (!scene || !script) throw new HttpError("That scene is missing its script.", 500);
  const userLines = thread.messages.filter((item) => item.role === "user");

  if (act === "talk") {
    thread.act = thread.repairVisits > 0 ? "repair" : "talk";
    return saveThread(thread);
  }

  if (act === "mirror") {
    if (userLines.length < 2) {
      throw new HttpError("Say at least two lines before you switch chairs.");
    }
    thread.act = "mirror";
    if (thread.mirrorMessages.length === 0) {
      thread.mirrorMessages.push(
        message({
          role: "stage",
          text: `You are ${scene.character.name} now. The voice across from you is built from your own lines.`,
        }),
      );
    }
    return saveThread(thread);
  }

  if (act === "reflect") {
    if (userLines.length < 1) throw new HttpError("The notes need a scene to look at.");
    thread.act = "reflect";
    thread.turningPoint = pickTurningPoint(thread.messages);
    if (thread.reflection.length === 0 && thread.turningPoint) {
      thread.reflection = reflectionQuestions(thread.totals, thread.turningPoint.quote);
    }
    return saveThread(thread);
  }

  const filed = thread.reflection.length > 0 && thread.reflection.every((item) => item.answer.trim());
  if (!filed) throw new HttpError("File the notes before you come back to repair this.");
  if (thread.repairVisits > 0) {
    thread.act = "repair";
    return saveThread(thread);
  }
  thread.act = "repair";
  thread.repairVisits += 1;
  thread.stalled = false;
  thread.messages.push(
    message({
      role: "stage",
      text: "Second showing. They remember. Nothing has been reset.",
    }),
  );
  thread.messages.push(
    message({
      role: "character",
      text: repairOpening(script, thread.sharpest),
      voice: "house",
    }),
  );
  return saveThread(thread);
}

export async function fileNotes(
  threadId: string,
  answers: { id: string; answer: string }[],
  snapshot?: unknown,
) {
  const thread = await takeThread(threadId, snapshot);
  if (!thread) throw new HttpError("That showing could not be found.", 404);
  if (thread.reflection.length === 0) {
    throw new HttpError("Open the notes before you file them.");
  }
  const byId = new Map(answers.map((answer) => [answer.id, answer.answer]));
  if (thread.reflection.some((item) => !byId.get(item.id))) {
    throw new HttpError("All three notes need an answer.");
  }
  thread.reflection = thread.reflection.map((item) => ({
    ...item,
    answer: byId.get(item.id) ?? item.answer,
  }));
  mark(thread, "reflect");
  thread.act = "reflect";
  return saveThread(thread);
}
