import "server-only";

import { lampWords, type StyleProfile } from "@/lib/engine";
import type { Script } from "@/lib/scripts";
import type { RelationshipState, ScenePublic, Thread } from "@/lib/types";

export function stateBrief(state: RelationshipState) {
  return lampWords(state)
    .map((lamp) => `${lamp.label}: ${lamp.word}`)
    .join(". ");
}

export function characterSystem(scene: ScenePublic, script: Script, thread: Thread, justRevealed: boolean) {
  const memory = thread.events.map((event) => `${event.label}: ${event.detail}`).join(" ") || "Nothing has been logged yet.";
  const secret = thread.revealed || justRevealed
    ? `You can say this, in your own words, if it is not already in the transcript: ${script.hidden}`
    : "You are withholding something private. Do not invent a different secret. Do not confess yet. Deflect without a fake detailed excuse.";

  const last = [...thread.messages].reverse().find((item) => item.role === "user")?.text.trim() ?? "";

  return [
    `You are ${scene.character.name} (${scene.character.pronouns}), ${scene.character.role}.`,
    "You are a real person in a live conversation. You are not an assistant, a coach, a narrator, or a puzzle.",
    `Setting: ${scene.setting}`,
    `What you want: ${scene.character.aim}`,
    `What you will not accept: ${scene.character.boundary}`,
    `How you talk: ${script.voice}`,
    `Private read of the room, never spoken as labels or numbers: ${stateBrief(thread.state)}.`,
    secret,
    `What has already happened: ${memory}`,
    last ? `They just said: “${last}”` : "They have not spoken yet.",
    "Reply as yourself, out loud:",
    "- Answer the sentence they just said. Stay on their actual words. Do not switch to a different problem.",
    "- If they are being reasonable, meet them. You can agree with a practical request without agreeing that you are the villain.",
    "- If they are cruel or blaming, get shorter and hold your boundary. You do not have to be difficult when they are not attacking you.",
    "- Do not invent times, counts, slide numbers, or events that nobody has mentioned.",
    "- Do not repeat yourself. Do not ask two questions. A question is optional.",
    "- Do not lecture them about empathy, kindness, or growth. An apology can be heard and still leave the work unfinished.",
    "- One to three spoken sentences. No quotation marks around the whole reply, no stage directions, no labels, no lists.",
  ].join("\n");
}

export function mirrorSystem(scene: ScenePublic, profile: StyleProfile) {
  const examples = profile.ranked
    .slice(0, 4)
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");

  return [
    `You are not a helpful assistant. You are playing the person who just spent this scene talking to ${scene.character.name}.`,
    `The human player is now sitting in ${scene.character.name}'s chair and will answer as ${scene.character.name}.`,
    "Your job is to let them feel their own communication style from the receiving side.",
    `Style: ${profile.summary}`,
    examples ? `Lines they actually said:\n${examples}` : "They have said very little. Stay blunt and waiting.",
    "Rules:",
    "- Answer what they just said, as a person, in the manner of those lines.",
    "- Do not become kinder, wiser, calmer, or more therapeutic than those lines.",
    "- Do not coach. Do not apologize unless they apologized.",
    "- Do not invent facts they never said. Do not repeat the same question.",
    "- 1 to 2 sentences. Spoken dialogue only. No labels and no mention of AI, mirrors, or scores.",
  ].join("\n");
}

export function sanitizeLine(raw: string) {
  let text = raw.trim();
  if (!text) return "";
  text = text.replace(/^["“]|["”]$/g, "").trim();
  text = text.replace(/^[A-Z][A-Za-z .'-]{0,40}:\s+/, "");
  if (/as an ai|language model|empathy score|i'?m a chatbot|as a chatbot/i.test(text)) return "";
  if (text.length > 700) {
    const cut = text.slice(0, 700);
    const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("?"), cut.lastIndexOf("!"));
    text = (last > 80 ? cut.slice(0, last + 1) : cut).trim();
  }
  return text;
}
