import {
  STATE_KEYS,
  type Expression,
  type Message,
  type ReflectionPrompt,
  type RelationshipState,
  type SignalKey,
  type Signals,
  type TurningPoint,
} from "./types";
import { clip } from "./utils";

export const SIGNAL_KEYS: SignalKey[] = [
  "accusation",
  "curiosity",
  "apology",
  "justification",
  "honesty",
  "kindness",
  "respectBoundary",
  "demandForgiveness",
  "contempt",
  "assumption",
  "specific",
  "appeasement",
  "question",
];

const REVEAL_OPENNESS = 52;

export function emptySignals(): Signals {
  return {
    accusation: 0,
    curiosity: 0,
    apology: 0,
    justification: 0,
    honesty: 0,
    kindness: 0,
    respectBoundary: 0,
    demandForgiveness: 0,
    contempt: 0,
    assumption: 0,
    specific: 0,
    appeasement: 0,
    question: 0,
  };
}

export function addSignals(left: Signals, right: Signals): Signals {
  const next = emptySignals();
  for (const key of SIGNAL_KEYS) next[key] = left[key] + right[key];
  return next;
}

function mentioned(text: string, re: RegExp): boolean {
  const copy = new RegExp(re.source, re.flags.replace("g", ""));
  const match = copy.exec(text);
  if (!match || match.index === undefined) return false;
  const before = text.slice(Math.max(0, match.index - 18), match.index);
  const clause = before.split(/[.!?]/).pop() ?? before;
  return !/\b(not|never|no|aren'?t|isn'?t|don'?t|doesn'?t|didn'?t)\b/i.test(clause);
}

export function detectSignals(text: string, keywords: string[]): Signals {
  const signals = emptySignals();
  const raw = text.trim();
  if (!raw) return signals;

  const hit = (re: RegExp) => mentioned(raw, re);

  if (
    hit(/\byou always\b/i) ||
    hit(/\byou never\b/i) ||
    hit(/\byour fault\b/i) ||
    hit(/\byou (didn't|did not|haven't|have not)\b/i) ||
    hit(/\bwhy didn't you\b/i) ||
    hit(/\byou dropped the ball\b/i) ||
    hit(/\byou screwed\b/i) ||
    hit(/\byou('re| are) useless\b/i)
  ) {
    signals.accusation = 1;
  }

  if (
    hit(/\bhelp me understand\b/i) ||
    hit(/\bwhat happened\b/i) ||
    hit(/\bwhat was going on\b/i) ||
    hit(/\bwhat(?:'s| is) going on\b/i) ||
    hit(/\bon your side\b/i) ||
    hit(/\bare you (okay|ok|alright)\b/i) ||
    hit(/\bhow are you\b/i) ||
    hit(/\bcan you tell me\b/i) ||
    hit(/\bwhat do you need\b/i) ||
    hit(/\bwhat was that like\b/i) ||
    (/\?/.test(raw) &&
      hit(/\b(what|how|why|when)\b/i) &&
      !hit(/\bwhy didn't you\b/i))
  ) {
    signals.curiosity = 1;
  }

  if (/\?/.test(raw)) signals.question = 1;

  if (
    !/\bnot sorry\b/i.test(raw) &&
    (hit(/\bi(?:'| a)?m sorry\b/i) ||
      hit(/\bi apologize\b/i) ||
      hit(/\bi was wrong\b/i) ||
      hit(/\bi messed up\b/i) ||
      hit(/\bthat was on me\b/i) ||
      hit(/\bi hurt you\b/i) ||
      hit(/\bi(?:'| a)?m responsible\b/i))
  ) {
    signals.apology = 1;
  }

  if (
    hit(/\bjust a joke\b/i) ||
    hit(/\bi didn't mean\b/i) ||
    hit(/\bi did not mean\b/i) ||
    hit(/\boverreact/i) ||
    hit(/\bcalm down\b/i) ||
    (signals.apology === 1 && /\bbut\b/i.test(raw))
  ) {
    signals.justification = 1;
  }

  if (
    hit(/\bi need\b/i) ||
    hit(/\bi needed\b/i) ||
    (hit(/\bi feel\b/i) && !/\bi feel like you\b/i.test(raw)) ||
    hit(/\bi felt\b/i) ||
    hit(/\bi was hurt\b/i) ||
    hit(/\bi(?:'| a)?m asking\b/i) ||
    hit(/\bwhat i want\b/i) ||
    hit(/\bi (just )?want\b/i) ||
    hit(/\bi want us\b/i) ||
    hit(/\bcan we figure\b/i) ||
    hit(/\bi have to be honest\b/i) ||
    hit(/\bi want to be honest\b/i)
  ) {
    signals.honesty = 1;
  }

  if (
    hit(/\bthat sounds\b/i) ||
    hit(/\bi can see\b/i) ||
    hit(/\bmakes sense\b/i) ||
    hit(/\bthank you for\b/i) ||
    hit(/\bthat must\b/i) ||
    hit(/\bi imagine\b/i)
  ) {
    signals.kindness = 1;
  }

  if (
    hit(/\byou don(?:'|’)t have to\b/i) ||
    hit(/\byou do not have to\b/i) ||
    hit(/\byou don(?:'|’)t owe\b/i) ||
    hit(/\byou do not owe\b/i) ||
    hit(/\bno pressure\b/i) ||
    hit(/\btake your time\b/i) ||
    hit(/\byour (choice|call)\b/i) ||
    hit(/\bi can wait\b/i)
  ) {
    signals.respectBoundary = 1;
  }

  if (
    hit(/\bjust forgive\b/i) ||
    hit(/\bget over it\b/i) ||
    hit(/\bjust move on\b/i) ||
    hit(/\byou need to move on\b/i) ||
    hit(/\blet it go\b/i) ||
    hit(/\btoo sensitive\b/i) ||
    hit(/\bdon(?:'|’)t be dramatic\b/i) ||
    hit(/\bstop being so\b/i)
  ) {
    signals.demandForgiveness = 1;
  }

  if (
    hit(/\bidiot\b/i) ||
    hit(/\bstupid\b/i) ||
    hit(/\bpathetic\b/i) ||
    hit(/\bshut up\b/i) ||
    hit(/\bgrow up\b/i) ||
    hit(/\bscrew you\b/i) ||
    hit(/\bi hate you\b/i)
  ) {
    signals.contempt = 1;
  }

  if (
    hit(/\byou don(?:'|’)t care\b/i) ||
    hit(/\byou do not care\b/i) ||
    hit(/\byou(?:'re| are) lazy\b/i) ||
    hit(/\byou ignored\b/i) ||
    hit(/\byou don(?:'|’)t respect\b/i) ||
    hit(/\byou do not respect\b/i)
  ) {
    signals.assumption = 1;
  }

  const lower = raw.toLowerCase();
  if (keywords.some((word) => lower.includes(word.toLowerCase()))) {
    signals.specific = 1;
  }

  if (signals.assumption && signals.apology && /\bwrong to\b/i.test(raw)) {
    signals.assumption = 0;
  }

  const onlySmooth =
    /^(ok|okay|fine|it's fine|its fine|no worries|all good|we're good|we are good|forget it|don't worry about it|it's okay|its okay|all right|alright)\.?$/i.test(
      raw,
    );
  const shortSmooth =
    raw.length <= 42 &&
    /\b(no worries|it's fine|its fine|all good|we're good|forget it)\b/i.test(raw) &&
    !/\b(but|need|felt|sorry|what|why|how)\b/i.test(raw);
  if ((onlySmooth || shortSmooth) && !signals.honesty && !signals.apology) {
    signals.appeasement = 1;
  }

  return signals;
}

function addDelta(
  delta: Partial<RelationshipState>,
  key: keyof RelationshipState,
  amount: number,
) {
  delta[key] = (delta[key] ?? 0) + amount;
}

export function applyState(
  state: RelationshipState,
  delta: Partial<RelationshipState>,
): RelationshipState {
  const next = { ...state };
  for (const key of STATE_KEYS) {
    if (delta[key] === undefined) continue;
    next[key] = Math.max(0, Math.min(100, Math.round(state[key] + delta[key])));
  }
  return next;
}

export type StepResult = {
  state: RelationshipState;
  delta: Partial<RelationshipState>;
  totals: Signals;
  justRevealed: boolean;
  caption: string | null;
};

export function step(input: {
  state: RelationshipState;
  signals: Signals;
  totals: Signals;
  revealed: boolean;
  mode: "talk" | "repair";
}): StepResult {
  const delta: Partial<RelationshipState> = {};
  const { signals } = input;

  if (signals.accusation) {
    addDelta(delta, "frustration", 12);
    addDelta(delta, "openness", -8);
    addDelta(delta, "unresolved", 8);
    addDelta(delta, "trust", -6);
  }
  if (signals.curiosity && !signals.contempt) {
    addDelta(delta, "openness", 10);
    addDelta(delta, "frustration", -5);
    addDelta(delta, "trust", 3);
  }
  if (signals.apology && signals.justification) {
    addDelta(delta, "repair", 3);
    addDelta(delta, "frustration", 4);
    addDelta(delta, "unresolved", 2);
  } else if (signals.apology) {
    addDelta(delta, "repair", 14);
    addDelta(delta, "frustration", -8);
    addDelta(delta, "trust", 5);
    addDelta(delta, "unresolved", -6);
  }
  if (signals.honesty) {
    addDelta(delta, "trust", 7);
    addDelta(delta, "frustration", 4);
    addDelta(delta, "unresolved", -4);
    addDelta(delta, "openness", 2);
  }
  if (signals.kindness && !signals.contempt) {
    addDelta(delta, "openness", 7);
    addDelta(delta, "frustration", -6);
    addDelta(delta, "trust", 4);
  }
  if (signals.respectBoundary) {
    addDelta(delta, "trust", 8);
    addDelta(delta, "boundary", -8);
    addDelta(delta, "repair", 5);
    addDelta(delta, "openness", 4);
  }
  if (signals.demandForgiveness) {
    addDelta(delta, "frustration", 12);
    addDelta(delta, "boundary", 10);
    addDelta(delta, "repair", -8);
    addDelta(delta, "trust", -4);
  }
  if (signals.contempt) {
    addDelta(delta, "trust", -16);
    addDelta(delta, "frustration", 16);
    addDelta(delta, "openness", -12);
    addDelta(delta, "boundary", 6);
  }
  if (signals.assumption && !signals.curiosity) {
    addDelta(delta, "openness", -8);
    addDelta(delta, "frustration", 8);
    addDelta(delta, "trust", -4);
  }
  if (signals.specific && !signals.accusation && !signals.contempt) {
    addDelta(delta, "trust", 4);
    addDelta(delta, "unresolved", -3);
    addDelta(delta, "openness", 3);
  }
  if (
    signals.appeasement &&
    !signals.honesty &&
    !signals.curiosity &&
    !signals.apology
  ) {
    addDelta(delta, "frustration", -2);
    addDelta(delta, "unresolved", 6);
    addDelta(delta, "trust", -2);
  }
  if (
    signals.question &&
    !signals.curiosity &&
    !signals.accusation &&
    !signals.contempt
  ) {
    addDelta(delta, "openness", 2);
  }

  if (input.mode === "repair") {
    if (signals.apology && !signals.justification) {
      addDelta(delta, "repair", 6);
      addDelta(delta, "trust", 3);
    }
    if (signals.accusation && input.totals.accusation >= 1) {
      addDelta(delta, "frustration", 5);
      addDelta(delta, "trust", -3);
    }
  }

  for (const key of STATE_KEYS) {
    if (delta[key] === undefined) continue;
    delta[key] = Math.max(-16, Math.min(16, delta[key]));
  }

  const state = applyState(input.state, delta);
  const totals = addSignals(input.totals, signals);
  const justRevealed = !input.revealed && shouldReveal(state, totals);

  return {
    state,
    delta,
    totals,
    justRevealed,
    caption: principleCaption(signals, justRevealed),
  };
}

export function shouldReveal(state: RelationshipState, totals: Signals) {
  return (
    totals.curiosity >= 2 &&
    totals.contempt === 0 &&
    state.openness >= REVEAL_OPENNESS &&
    state.frustration < 74 &&
    state.boundary < 85
  );
}

export function principleCaption(signals: Signals, justRevealed: boolean) {
  if (justRevealed) {
    return "Compassion: a circumstance you could not see just came into the room.";
  }
  if (signals.contempt) return "That landed as contempt. The boundary got firmer.";
  if (signals.demandForgiveness) {
    return "Respect: forgiveness was demanded, so the boundary held.";
  }
  if (signals.assumption && !signals.curiosity) {
    return "An assumption just took the place of a question.";
  }
  if (signals.apology && signals.justification) {
    return "The apology arrived with a defense still attached.";
  }
  if (signals.appeasement && !signals.honesty && !signals.curiosity) {
    return "Smoothing it over did not settle what is still unresolved.";
  }
  if (signals.honesty) {
    return "Integrity: naming the real thing made the air tighter, and a little clearer.";
  }
  if (signals.kindness) return "Kindness: you left room for their circumstances.";
  if (signals.respectBoundary) {
    return "Respect: you did not push past a line they were holding.";
  }
  if (signals.apology) return "Forgiveness is not a switch. Repair became possible.";
  if (signals.curiosity && !signals.accusation) {
    return "A question opened more than a verdict would have.";
  }
  return null;
}

export function applyPause(state: RelationshipState): {
  state: RelationshipState;
  delta: Partial<RelationshipState>;
  caption: string;
} {
  if (state.frustration >= 60) {
    const delta = { frustration: -8, openness: 4 };
    return {
      state: applyState(state, delta),
      delta,
      caption: "You left a beat. Some of the heat had somewhere to go.",
    };
  }
  if (state.unresolved >= 50 && state.frustration < 40) {
    const delta = { unresolved: 4 };
    return {
      state: applyState(state, delta),
      delta,
      caption: "The pause read as leaving the issue on the table.",
    };
  }
  const delta = { openness: 2 };
  return {
    state: applyState(state, delta),
    delta,
    caption: "A beat. They wait to see what you will do with it.",
  };
}

export function isStalled(state: RelationshipState, totals: Signals) {
  return (state.trust <= 18 && state.frustration >= 78) || totals.contempt >= 3;
}

export function sceneCanRest(state: RelationshipState) {
  return (
    state.unresolved <= 32 &&
    state.repair >= 55 &&
    state.frustration <= 42 &&
    state.trust >= 52
  );
}

export function expressionFor(state: RelationshipState, stalled: boolean): Expression {
  if (stalled || state.frustration >= 75) return "bristling";
  if (state.boundary >= 68 && state.openness < 50) return "firm";
  if (state.openness >= 62 && state.frustration < 50) return "open";
  if (state.trust >= 60 && state.frustration < 45) return "steady";
  if (state.openness >= 48 && state.frustration < 60) return "listening";
  return "guarded";
}

export function postureLine(expression: Expression) {
  switch (expression) {
    case "bristling":
      return "Their shoulders rise. The next sentence is shorter.";
    case "firm":
      return "They stay. They are not moving toward agreement.";
    case "open":
      return "Something unclenches. They are still choosing their words.";
    case "steady":
      return "The room is quieter. Nothing has been erased.";
    case "listening":
      return "They are actually waiting for the rest of your sentence.";
    default:
      return "They keep the important part back.";
  }
}

export function lampWords(state: RelationshipState) {
  const bucket = (
    n: number,
    words: [string, string, string, string],
    cuts: [number, number, number] = [30, 50, 70],
  ) => {
    if (n < cuts[0]) return words[0];
    if (n < cuts[1]) return words[1];
    if (n < cuts[2]) return words[2];
    return words[3];
  };
  return [
    { id: "trust", label: "Trust", word: bucket(state.trust, ["Distant", "Wary", "Steady", "Solid"]) },
    { id: "heat", label: "Heat", word: bucket(state.frustration, ["Cool", "Warm", "Hot", "Searing"]) },
    { id: "open", label: "Openness", word: bucket(state.openness, ["Shut", "Ajar", "Opening", "Open"]) },
    { id: "repair", label: "Repair", word: bucket(state.repair, ["Not yet", "Possible", "Begun", "Underway"], [22, 48, 72]) },
  ];
}

export function charge(signals: Signals) {
  return (
    signals.accusation * 2 +
    signals.assumption * 2 +
    signals.contempt * 3 +
    signals.demandForgiveness * 2 +
    signals.justification
  );
}

export function magnitude(delta: Partial<RelationshipState> | undefined) {
  if (!delta) return 0;
  return STATE_KEYS.reduce((sum, key) => sum + Math.abs(delta[key] ?? 0), 0);
}

export function pickTurningPoint(messages: Message[]): TurningPoint | null {
  const users = messages.filter((message) => message.role === "user");
  if (!users.length) return null;
  let best = users[0];
  let bestScore = -1;
  for (const message of users) {
    const score = magnitude(message.delta);
    if (score > bestScore) {
      best = message;
      bestScore = score;
    }
  }
  return {
    messageId: best.id,
    quote: best.text,
    note:
      bestScore > 0
        ? "This is where the room moved the most."
        : "Nothing shifted much. That stillness is also information.",
  };
}

export function reflectionQuestions(
  totals: Signals,
  quote: string,
): ReflectionPrompt[] {
  const heard = `When you said “${clip(quote, 180)}”, what do you think the other person heard?`;
  const second =
    totals.assumption >= 1 || totals.accusation >= 1
      ? "What had you already decided was true before they explained their side?"
      : "What information did you not have yet, and how did you handle not having it?";
  const third =
    totals.appeasement >= 1 && totals.honesty === 0
      ? "Where did keeping the peace cost you the chance to say what you actually needed?"
      : "Where could you have kept your position and changed only the way it was delivered?";

  return [
    { id: "heard", question: heard, answer: "" },
    { id: "missing", question: second, answer: "" },
    { id: "delivery", question: third, answer: "" },
  ];
}

export type StyleProfile = {
  summary: string;
  traits: string[];
  sharpest: string;
  ranked: string[];
};

export function styleProfile(lines: string[], keywords: string[] = []): StyleProfile {
  const ranked = [...lines].sort(
    (a, b) => charge(detectSignals(b, keywords)) - charge(detectSignals(a, keywords)),
  );
  const totals = lines.reduce(
    (sum, line) => addSignals(sum, detectSignals(line, keywords)),
    emptySignals(),
  );
  const avg =
    lines.reduce((sum, line) => sum + line.length, 0) / Math.max(1, lines.length);
  const traits: string[] = [];
  traits.push(avg < 90 ? "short lines" : "long lines");
  if (totals.accusation > totals.curiosity && totals.accusation > 0) {
    traits.push("verdicts before questions");
  }
  if (totals.curiosity > totals.accusation) traits.push("questions");
  if (totals.apology && totals.justification) traits.push("apologies with a defense attached");
  else if (totals.apology) traits.push("direct apologies");
  if (totals.honesty) traits.push("naming what you need");
  if (totals.contempt) traits.push("contempt");
  const summary = lines.length
    ? `Your voice in this scene: ${traits.join(", ")}.`
    : "Your voice in this scene is still thin. A few more lines and the mirror gets sharper.";
  return {
    summary,
    traits,
    sharpest: ranked[0] ?? "",
    ranked,
  };
}

export function mirrorFallback(profile: StyleProfile, turnIndex: number) {
  const line = profile.ranked[turnIndex];
  if (line) return line;
  if (profile.sharpest) {
    return `I'm still on what I said. “${clip(profile.sharpest, 180)}”`;
  }
  return "Say something. I'm waiting.";
}
