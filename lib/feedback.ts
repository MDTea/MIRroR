import "server-only";

import { completeJson } from "@/lib/openai";
import type { Feedback, Message, ResponseFeedback, ScenePublic, Signals, Thread } from "@/lib/types";
import { clip } from "@/lib/utils";

export function scoreSignals(s: Signals) {
  const apology = s.apology && !s.justification ? 3 : s.apology ? 1 : 0;
  const question = s.question && !s.accusation && !s.contempt ? 1 : 0;
  return (
    s.curiosity * 3 +
    apology +
    s.honesty * 2 +
    s.kindness * 2 +
    s.respectBoundary * 2 +
    s.specific +
    question -
    s.accusation * 3 -
    s.contempt * 5 -
    s.demandForgiveness * 3 -
    s.assumption * 2 -
    s.justification -
    s.appeasement
  );
}

function heuristic(s: Signals | undefined) {
  const pros: string[] = [];
  const cons: string[] = [];
  if (!s) return { pros: ["You kept the conversation going."], cons: [], tryInstead: "Add one honest sentence about what you need, then ask what they need." };
  if (s.curiosity) pros.push("You asked about their side instead of assuming it.");
  if (s.apology && !s.justification) pros.push("You owned your part without attaching a defense.");
  if (s.honesty) pros.push("You said plainly what you need.");
  if (s.kindness) pros.push("You acknowledged what this might be like for them.");
  if (s.respectBoundary) pros.push("You left them room to choose instead of pushing.");
  if (s.specific) pros.push("You stayed on the concrete issue.");

  if (s.accusation) cons.push("This landed as a verdict about them, which makes people defend instead of listen.");
  if (s.contempt) cons.push("The insult shut the door. After contempt, people stop hearing the point.");
  if (s.demandForgiveness) cons.push("Pushing them to be over it made them dig in.");
  if (s.assumption) cons.push("You decided their motive before asking about it.");
  if (s.justification) cons.push("The explanation drowned out the apology.");
  if (s.appeasement) cons.push("Smoothing it over left the real problem standing.");

  let tryInstead = "Keep this shape. Next, check what they need from you.";
  if (s.contempt) tryInstead = "“I'm really frustrated, and I still want to fix this with you.”";
  else if (s.accusation || s.assumption) tryInstead = "“Before I decide what this means, what happened on your side?”";
  else if (s.demandForgiveness) tryInstead = "“You don't have to be okay with it yet. I want to understand.”";
  else if (s.justification) tryInstead = "“I'm sorry. That was on me.” Then stop and let it land.";
  else if (s.appeasement) tryInstead = "“It isn't fine for me, and I'd like to talk about it.”";
  else if (!pros.length) tryInstead = "Add one honest sentence about what you need, then ask what they need.";

  if (!pros.length) pros.push("You kept the conversation going.");
  if (!cons.length && pros.length < 2) cons.push("It didn't name what you need or ask what they need, so it is easy to talk past each other.");
  return { pros, cons, tryInstead };
}

function strings(value: unknown, max = 3) {
  if (!Array.isArray(value)) return null;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => clip(item, 280))
    .filter(Boolean)
    .slice(0, max);
}

function unique(items: string[], max: number) {
  return [...new Set(items)].slice(0, max);
}

function pairs(messages: Message[]) {
  const out: { line: Message; reply: string }[] = [];
  messages.forEach((item, index) => {
    if (item.role !== "user") return;
    const reply = messages.slice(index + 1).find((next) => next.role === "character" || next.role === "user");
    out.push({ line: item, reply: reply?.role === "character" ? reply.text : "" });
  });
  return out.slice(-20);
}

function headline(points: number, count: number) {
  const average = points / Math.max(1, count);
  if (average >= 2.5) return "You kept the door open the whole way through. You were honest about what you needed and curious about their side.";
  if (average >= 0.5) return "There were real moments of listening in this. A few lines pulled the conversation back toward blame or smoothing it over.";
  return "This one got heated or stuck. That is useful to see. The lines below show where it turned and what might have landed better.";
}

export async function buildFeedback(thread: Thread, scene: ScenePublic): Promise<Feedback> {
  const rows = pairs(thread.messages);
  const points = rows.reduce((sum, row) => sum + (row.line.points ?? 0), 0);
  const base = rows.map((row) => heuristic(row.line.signals));

  let data: Record<string, unknown> | null = null;
  try {
    const system = [
      "You are a warm, honest communication coach reviewing a practice conversation from a social simulator.",
      `Scenario: ${scene.premise}`,
      `The other person: ${scene.character.name}, ${scene.character.role}. What they wanted: ${scene.character.aim}`,
      "For every numbered line the user wrote, explain how it was probably received. Refer to their actual words. Be kind and specific. Do not flatter.",
      "Each line has an internal score from a rules engine. Use it only as a hint. Never mention numbers, points, or scores.",
      'Return only JSON: {"summary": string, "pros": string[], "cons": string[], "responses": [{"n": number, "pros": string[], "cons": string[], "tryInstead": string}]}',
      "summary is two sentences addressed to the user as 'you'. Overall pros and cons have 2 to 4 items each.",
      "Each response has 1 to 3 pros and 0 to 3 cons. tryInstead is one line the user could have said instead, written as dialogue.",
    ].join("\n");
    const user = rows
      .map(
        (row, index) =>
          `${index + 1}. You said: "${row.line.text}" (internal score ${row.line.points ?? 0})` +
          (row.reply ? `\n   ${scene.character.name} replied: "${row.reply}"` : ""),
      )
      .join("\n");
    data = await completeJson(system, user, 1800, 0.4);
  } catch (error) {
    console.error("Feedback model failed:", error instanceof Error ? error.message : "unknown");
  }

  const live = Array.isArray(data?.responses) ? (data.responses as Record<string, unknown>[]) : [];
  const responses: ResponseFeedback[] = rows.map((row, index) => {
    const found = live.find((item) => item && Number(item.n) === index + 1);
    const pros = strings(found?.pros);
    const cons = strings(found?.cons);
    const tryInstead = typeof found?.tryInstead === "string" && found.tryInstead.trim() ? clip(found.tryInstead, 280) : base[index].tryInstead;
    return {
      messageId: row.line.id,
      text: row.line.text,
      reply: row.reply,
      pros: pros?.length ? pros : base[index].pros,
      cons: cons ?? base[index].cons,
      tryInstead,
    };
  });

  const pros = strings(data?.pros, 4);
  const cons = strings(data?.cons, 4);
  const summary = typeof data?.summary === "string" && data.summary.trim() ? clip(data.summary, 480) : headline(points, rows.length);

  return {
    summary,
    pros: pros?.length ? pros : unique(base.flatMap((item) => item.pros), 4),
    cons: cons?.length
      ? cons
      : unique(base.flatMap((item) => item.cons), 4).concat(
          base.some((item) => item.cons.length) ? [] : ["Not much to fix. Next time, try naming what you need a little earlier."],
        ),
    responses,
    createdAt: new Date().toISOString(),
  };
}
