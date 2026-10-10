import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyPause,
  detectSignals,
  emptySignals,
  isStalled,
  lampWords,
  mirrorFallback,
  pickTurningPoint,
  reflectionQuestions,
  sceneCanRest,
  shouldReveal,
  step,
  styleProfile,
} from "./engine";
import type { Message, RelationshipState } from "./types";

const jordan: RelationshipState = {
  trust: 46,
  frustration: 38,
  openness: 34,
  unresolved: 62,
  boundary: 42,
  repair: 18,
};

describe("detectSignals", () => {
  it("does not treat a negated blame as an accusation", () => {
    const signals = detectSignals(
      "It's not your fault. I need the slides by Thursday.",
      ["slides"],
    );
    assert.equal(signals.accusation, 0);
    assert.equal(signals.honesty, 1);
    assert.equal(signals.specific, 1);
  });

  it("hears a defense stuck to an apology", () => {
    const signals = detectSignals("I'm sorry, but it was just a joke.", ["joke"]);
    assert.equal(signals.apology, 1);
    assert.equal(signals.justification, 1);
  });

  it("does not call 'not sorry' an apology", () => {
    const signals = detectSignals("I am not sorry.", []);
    assert.equal(signals.apology, 0);
  });
});

describe("step", () => {
  it("lets an accusation heat the room and close it", () => {
    const result = step({
      state: jordan,
      signals: { ...emptySignals(), accusation: 1 },
      totals: emptySignals(),
      revealed: false,
      mode: "talk",
    });
    assert.equal(result.state.trust, 40);
    assert.equal(result.state.frustration, 50);
    assert.equal(result.state.openness, 26);
    assert.equal(result.state.unresolved, 70);
    assert.ok(result.state.trust < jordan.trust);
  });

  it("does not let niceness clear the conflict", () => {
    const result = step({
      state: jordan,
      signals: { ...emptySignals(), kindness: 1 },
      totals: emptySignals(),
      revealed: false,
      mode: "talk",
    });
    assert.equal(result.state.unresolved, jordan.unresolved);
    assert.ok(result.state.trust > jordan.trust);
    assert.ok(result.state.openness > jordan.openness);
  });

  it("lets appeasement cool the heat while the conflict grows", () => {
    const result = step({
      state: jordan,
      signals: { ...emptySignals(), appeasement: 1 },
      totals: emptySignals(),
      revealed: false,
      mode: "talk",
    });
    assert.ok(result.state.trust < jordan.trust);
    assert.ok(result.state.unresolved > jordan.unresolved);
    assert.ok(result.state.frustration < jordan.frustration);
  });

  it("lets honesty build trust and tension together", () => {
    const result = step({
      state: jordan,
      signals: { ...emptySignals(), honesty: 1 },
      totals: emptySignals(),
      revealed: false,
      mode: "talk",
    });
    assert.ok(result.state.trust > jordan.trust);
    assert.ok(result.state.frustration > jordan.frustration);
    assert.ok(result.state.unresolved < jordan.unresolved);
  });

  it("barely repairs a sorry-but", () => {
    const result = step({
      state: jordan,
      signals: { ...emptySignals(), apology: 1, justification: 1 },
      totals: emptySignals(),
      revealed: false,
      mode: "talk",
    });
    assert.equal(result.state.repair, jordan.repair + 3);
    assert.ok(result.state.frustration > jordan.frustration);
  });

  it("opens repair on a clean apology without erasing the past", () => {
    const result = step({
      state: jordan,
      signals: { ...emptySignals(), apology: 1 },
      totals: emptySignals(),
      revealed: false,
      mode: "talk",
    });
    assert.equal(result.state.repair, 32);
    assert.ok(result.state.trust < 70);
    assert.ok(result.state.unresolved > 40);
  });

  it("hardens a boundary when forgiveness is demanded", () => {
    const result = step({
      state: jordan,
      signals: { ...emptySignals(), demandForgiveness: 1 },
      totals: emptySignals(),
      revealed: false,
      mode: "talk",
    });
    assert.equal(result.state.boundary, 52);
    assert.equal(result.state.repair, 10);
  });

  it("reveals hidden context only after real curiosity", () => {
    const first = step({
      state: jordan,
      signals: { ...emptySignals(), curiosity: 1 },
      totals: emptySignals(),
      revealed: false,
      mode: "talk",
    });
    assert.equal(first.justRevealed, false);
    const second = step({
      state: first.state,
      signals: { ...emptySignals(), curiosity: 1 },
      totals: first.totals,
      revealed: false,
      mode: "talk",
    });
    assert.equal(second.justRevealed, true);
    assert.equal(second.caption?.startsWith("Compassion"), true);
  });

  it("keeps a secret shut after contempt", () => {
    const burned = step({
      state: jordan,
      signals: { ...emptySignals(), contempt: 1 },
      totals: emptySignals(),
      revealed: false,
      mode: "talk",
    });
    const asked = step({
      state: { ...burned.state, openness: 80, frustration: 20 },
      signals: { ...emptySignals(), curiosity: 1 },
      totals: { ...burned.totals, curiosity: 2 },
      revealed: false,
      mode: "talk",
    });
    assert.equal(shouldReveal(asked.state, asked.totals), false);
  });

  it("remembers an old accusation on the repair visit", () => {
    const prior = { ...emptySignals(), accusation: 2 };
    const result = step({
      state: jordan,
      signals: { ...emptySignals(), accusation: 1 },
      totals: prior,
      revealed: true,
      mode: "repair",
    });
    const withoutMemory = step({
      state: jordan,
      signals: { ...emptySignals(), accusation: 1 },
      totals: emptySignals(),
      revealed: true,
      mode: "talk",
    });
    assert.ok(result.state.frustration > withoutMemory.state.frustration);
  });
});

describe("pauses, rest, and reflection", () => {
  it("spends a pause on heat", () => {
    const result = applyPause({ ...jordan, frustration: 70 });
    assert.equal(result.state.frustration, 62);
    assert.match(result.caption, /beat/i);
  });

  it("reads a pause as avoidance when the conflict is untouched", () => {
    const result = applyPause({ ...jordan, frustration: 20, unresolved: 60 });
    assert.equal(result.state.unresolved, 64);
  });

  it("knows when a scene can rest without calling it a win", () => {
    assert.equal(
      sceneCanRest({
        trust: 60,
        frustration: 30,
        openness: 60,
        unresolved: 20,
        boundary: 40,
        repair: 70,
      }),
      true,
    );
    assert.equal(sceneCanRest(jordan), false);
  });

  it("stalls a cruel room", () => {
    assert.equal(
      isStalled(
        { ...jordan, trust: 10, frustration: 90 },
        emptySignals(),
      ),
      true,
    );
  });

  it("hides the gauges behind words", () => {
    const lamps = lampWords(jordan);
    assert.equal(
      lamps.every((lamp) => Number.isNaN(Number(lamp.word))),
      true,
    );
    assert.equal(lamps.find((lamp) => lamp.id === "heat")?.word, "Warm");
  });

  it("picks the line that moved the room", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "user",
        text: "Whatever.",
        at: "",
        delta: { frustration: 2 },
      },
      {
        id: "2",
        role: "user",
        text: "You never care.",
        at: "",
        delta: { frustration: 12, trust: -6, openness: -8 },
      },
    ];
    const point = pickTurningPoint(messages);
    assert.equal(point?.messageId, "2");
    const questions = reflectionQuestions(
      { ...emptySignals(), accusation: 1 },
      point?.quote ?? "",
    );
    assert.equal(questions.length, 3);
    assert.match(questions[1].question, /already decided/i);
    assert.equal(questions.every((item) => !item.question.includes("%")), true);
  });

  it("rebuilds a mirror line from the player's own words", () => {
    const profile = styleProfile(
      ["You never do your part.", "Help me understand what happened?"],
      [],
    );
    assert.match(profile.summary, /Your voice/);
    assert.equal(mirrorFallback(profile, 0).includes("never") || mirrorFallback(profile, 0).includes("Help"), true);
  });
});
