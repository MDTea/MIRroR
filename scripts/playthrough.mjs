const base = "http://localhost:3000";

async function post(path, body) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(data)}`);
  return data;
}

const health = await (await fetch(base + "/api/health")).json();
console.log("health", health);

const created = await post("/api/threads", { slug: "empty-slide" });
const id = created.thread.id;
console.log("open", created.thread.messages[0].text);

async function say(text, mode = "talk") {
  const data = await post("/api/turn", { threadId: id, text, mode });
  const thread = data.thread;
  const lines = (mode === "mirror" ? thread.mirrorMessages : thread.messages)
    .slice(-3)
    .map((message) => `${message.role}: ${message.text}`);
  console.log("\nYOU:", text);
  console.log(lines.join("\n"));
  console.log("revealed", thread.revealed, "stalled", thread.stalled, "repair", thread.state.repair, "open", thread.state.openness);
  return thread;
}

await say("You never do any work. You are useless.");
await say("It's fine, no worries.");
await say("Help me understand what happened on your side?");
await say("What was going on for you this week?");
const revealed = await say("That sounds really hard. Can you tell me what happened?");
if (!revealed.revealed) throw new Error("Expected the hidden context to surface.");

const mirrored = await post("/api/act", { threadId: id, act: "mirror" });
console.log("\nMIRROR", mirrored.thread.mirrorMessages.at(-1).text);
await say("I froze. I should have said something.", "mirror");
const shard = await say("The slides are still my job. I was scared.", "mirror");
if (!shard.shards.includes("empty-slide")) throw new Error("Expected a shard.");

const notes = await post("/api/act", { threadId: id, act: "reflect" });
if (notes.thread.reflection.length !== 3) throw new Error("Expected three notes.");
console.log("\nNOTE", notes.thread.turningPoint.note);

const filed = await post("/api/reflect", {
  threadId: id,
  answers: notes.thread.reflection.map((item) => ({
    id: item.id,
    answer: "I decided they did not care before I knew what the week had been.",
  })),
});
if (!filed.thread.actsCompleted.includes("reflect")) throw new Error("Notes were not filed.");

const repair = await post("/api/act", { threadId: id, act: "repair" });
console.log("\nREPAIR", repair.thread.messages.at(-1).text);
const done = await say(
  "I was wrong. I need the middle slides by Thursday, and you do not have to explain it to the group.",
  "repair",
);
if (!done.actsCompleted.includes("repair")) throw new Error("Repair did not register.");
console.log("\nOK", done.actsCompleted.join(", "));
