import "server-only";

import type { RelationshipState, Signals } from "@/lib/types";

export type LineBank = {
  contempt: string;
  demand: string;
  accusation: string;
  accusationCurious: string;
  assumption: string;
  sorryBut: string;
  sorry: string;
  honesty: string;
  kindness: string;
  boundary: string;
  appease: string;
  specific: string;
  curiosity: string;
  repairSorry: string;
  repairPattern: string;
  defaultLine: string;
};

export type Script = {
  slug: string;
  keywords: string[];
  initial: RelationshipState;
  opening: string;
  voice: string;
  hidden: string;
  revealLine: string;
  afterReveal: string;
  repairOpen: string;
  repairFallback: string;
  stallLine: string;
  bank: LineBank;
};

export const scripts: Script[] = [
  {
    slug: "empty-slide",
    keywords: ["slide", "slides", "deck", "presentation", "thursday", "group chat", "critique"],
    initial: { trust: 46, frustration: 38, openness: 34, unresolved: 62, boundary: 42, repair: 18 },
    opening: "Hey. I saw the message in the group chat. Can we not do this in front of everyone?",
    voice: "Twenty, plain-spoken, a little defensive. No speeches. No therapy language.",
    hidden:
      "Your parent is in the hospital. You froze and did not say so. You know the slides are still your responsibility. You will only say this if the conversation has made room, and you will not let it erase the missing work.",
    revealLine:
      "My dad's in the hospital. I didn't know how to put that in the group chat, so I said nothing. The slides are still blank. That's on me. I just couldn't start with you announcing it.",
    afterReveal:
      "I should have told you before the deadline. I was scared it would sound like an excuse. It explains the silence. It doesn't finish the slides.",
    repairOpen:
      "Last time you said “{quote}” I'm here. I'm not pretending that didn't happen. If this is about the work, say what still has to get done.",
    repairFallback:
      "You came back. The slides are still the slides. I'm willing to talk about what happens next, not about whether I'm a good person.",
    stallLine:
      "I'm done with this version of the conversation. If you want to know how that felt, sit in this chair. I'm not staying for another insult.",
    bank: {
      contempt: "Don't talk to me like that. I'll deal with the deck. I won't stand here and get cut down.",
      demand: "You don't get to decide that I've forgiven the group chat because you want this over.",
      accusation: "So you've already decided I don't care. That's the whole conversation, then?",
      accusationCurious: "You can ask me that without the verdict. Which one do you actually want?",
      assumption: "Lazy is an easy word. You don't actually know what this week was.",
      sorryBut: "You're sorry, and then there's a but. I can hear the but louder than the sorry.",
      sorry: "Okay. I hear that. I'm still embarrassed, and I still didn't do the work. Both can be true.",
      honesty: "You need the slides done. That's fair. I can't pretend the last week didn't happen, but I can tell you what I can finish before the critique.",
      kindness: "I didn't expect you to ask if I was alright. I'm not, fully. That doesn't erase the deck.",
      boundary: "Thank you. I don't want to perform my week for the group. I do still owe you a section.",
      appease: "You don't have to let me off. The work is still missing. Being chill about it doesn't put anything on the slide.",
      specific: "Yeah. The middle section is mine, and it's blank. That's the fact. What are you asking me to do with it?",
      curiosity: "It's not nothing. I just don't want the first version of this to be you telling everyone I'm useless.",
      repairSorry: "I hear you. I'm not resetting us to fine. Tell me which slides you still need from me, and by when.",
      repairPattern: "We're back at the verdict. I came to talk about the work. If that's not available, say so.",
      defaultLine: "I'm not going to agree that I'm the villain so this can be over. Say what you actually need from me.",
    },
  },
  {
    slug: "the-joke",
    keywords: ["joke", "accent", "chat", "laugh", "message"],
    initial: { trust: 50, frustration: 66, openness: 28, unresolved: 74, boundary: 72, repair: 12 },
    opening: "If you came to tell me it was just a joke, you can save it.",
    voice: "Dry, exact, no performed warmth. Short when angry. You do not laugh this off.",
    hidden:
      "This is not the first time someone has done your accent for a laugh. A cousin did it last month. You are done explaining why intent is not the point. You will say this only if they stop defending the joke.",
    revealLine:
      "It wasn't one joke to me. My cousin did the accent bit last month and everyone laughed then too. I'm not asking you to agree you're a villain. I'm asking you to stop defending the laugh.",
    afterReveal:
      "You can be sorry and still have meant it as a joke. Those aren't opposites. What I need is for the chat to stop being a place where my voice is the bit.",
    repairOpen:
      "Last time you said “{quote}” I remember the wording. If you're back to own it, own it. Don't make me grade your apology.",
    repairFallback:
      "You came back. I'm willing to listen. I'm not willing to start over as if the message unsent itself.",
    stallLine:
      "We're done for today. I'm not going to be insulted on top of being mocked. The door is the door.",
    bank: {
      contempt: "Absolutely not. You don't get to be cruel and call it clearing the air.",
      demand: "You don't get to tell me to move on from a joke you haven't actually put down.",
      accusation: "If you came to explain why I'm difficult, you can leave with that.",
      accusationCurious: "Ask me what it did, or tell me why I'm wrong. Don't do both in one breath.",
      assumption: "You don't know what I can take. You know what you wanted the chat to do, which was laugh.",
      sorryBut: "There's the sorry, and there's the defense. I only have room for one of them right now.",
      sorry: "Thank you. I'm not ready to say we're fine. I am willing to hear what you want to do about the chat.",
      honesty: "Say that part again, without the cushion. If you mean you'll take it out of the chat, say that.",
      kindness: "I don't need you to feel bad in an impressive way. I need the joke to be over, including the explanation of the joke.",
      boundary: "Good. Then don't ask me to comfort you for having said it.",
      appease: "“It's fine” is the joke putting its coat back on. It isn't fine. Try again or don't.",
      specific: "Yes. The message. My accent. The laugh. You can talk about that without a speech about what you meant.",
      curiosity: "You want my side. My side is that I left because I was tired of being the entertainment.",
      repairSorry: "All right. I believe you're sorry. Forgiveness isn't a receipt I'm handing you. What are you changing in the chat?",
      repairPattern: "This is the same shape as last time. I'm not interested in a second round of being the problem.",
      defaultLine: "I'm still waiting for you to talk about what you did, not about how I took it.",
    },
  },
  {
    slug: "office-hours",
    keywords: ["grade", "claim", "source", "citation", "evidence", "paragraph", "thesis", "margin"],
    initial: { trust: 48, frustration: 24, openness: 40, unresolved: 55, boundary: 64, repair: 28 },
    opening:
      "You asked to discuss the grade. I have ten minutes. Talk to me about the argument, not about how hard you worked.",
    voice: "Complete sentences, no slang, impatient with grade-begging, genuinely interested if the student engages the claim.",
    hidden:
      "You reread the draft this morning. A sentence near the end does some of the work you said was missing. Paragraph three still cites a source that does not contain the finding. You were too quick in the margin, and the citation is still wrong. You will admit your haste only if the student gets curious about the argument rather than the points.",
    revealLine:
      "I reread the last page this morning. The sentence near the bottom does some of the work I said was missing. It does not rescue paragraph three. That source does not say what you claim it says. I was too quick in the margin, and the citation is still wrong.",
    afterReveal:
      "So we both missed something. I missed the last page. You missed what that citation can actually carry. Which of those do you want to work on in the time we have?",
    repairOpen:
      "You are back. Last time you said “{quote}” I have not changed the standard. I have kept the ten minutes.",
    repairFallback:
      "You came back. Bring me the claim, or bring me a better source. Do not bring me the hours.",
    stallLine:
      "This meeting is over. I will not be insulted in my office, and I will not bargain over a grade. You may schedule a different conversation when you can talk about the work.",
    bank: {
      contempt: "That is not how you speak to me. We are finished for today.",
      demand: "I do not owe you a gentler grade because the conversation is uncomfortable.",
      accusation: "If your point is that I have been unfair, make it about a sentence. I will not defend myself against a mood.",
      accusationCurious: "There is a real question in there. Ask it without the accusation and I will answer it.",
      assumption: "You may disagree with the mark. You may not decide I don't respect the work. You don't know that.",
      sorryBut: "An apology with a defense is still a defense. The citation remains the subject.",
      sorry: "Thank you. Being wrong about your tone does not repair the source. What do you want to look at?",
      honesty: "Good. That is a clearer request. Show me the sentence you think carries the claim, and I will tell you what I think it does.",
      kindness: "I appreciate the courtesy. Courtesy is not evidence. Take me to the paragraph.",
      boundary: "You may disagree and stay respectful. That is the whole offer. Use it.",
      appease: "You do not need to soothe me. I am not hurt. I am unconvinced. Those are different problems.",
      specific: "Yes. Stay on that paragraph. What, exactly, do you think the source says?",
      curiosity: "The unsupported part is the finding you attribute in paragraph three. Ask me what would count as support, if that is the question.",
      repairSorry: "I accept that you heard me. Now do the scholarly part. What replaces the citation?",
      repairPattern: "We have done the accusation. I will not spend another meeting on whether I am kind.",
      defaultLine: "I am not going to agree that the grade is the injury. What is the claim, and what supports it?",
    },
  },
  {
    slug: "unfinished",
    keywords: ["portfolio", "idea", "doc", "page", "credit", "post"],
    initial: { trust: 58, frustration: 34, openness: 44, unresolved: 57, boundary: 36, repair: 24 },
    opening: "You sounded serious. What's going on?",
    voice: "Warm, fast when hurt, a little tangled. You want to stay friends. You will not play the villain on command.",
    hidden:
      "You saw a comment on the shared doc that said 'feel free to use this.' You read it as a handoff. You did not ask. You will say this once you are not being sentenced, and you will still take the page down if they need that.",
    revealLine:
      "You wrote “feel free to use this” on the doc. I took that as a handoff. If that isn't what you meant, I need the actual boundary. I don't need to be called a thief before I can say that.",
    afterReveal:
      "I should have asked. You should know I wasn't trying to pocket it. The page can come down today. I still want to know what the comment was supposed to mean.",
    repairOpen:
      "Last time you said “{quote}” I've been thinking about that sentence. I'm here. The page is still up until we decide it isn't.",
    repairFallback:
      "You came back. Good. I'd rather finish this than let it sit in the doc like a grudge.",
    stallLine:
      "I'm not going to keep being talked to like I stole from you on purpose. Text me when you can say what you need without that.",
    bank: {
      contempt: "Wow. Okay. I'm not your enemy. If that's the register, I'm leaving the coffee.",
      demand: "You don't get to tell me we're good because the air feels awkward. The page is still up.",
      accusation: "So I'm a thief now. Do you want the story, or do you want the sentence you've already picked?",
      accusationCurious: "I'll answer you. Drop the part where you've already decided who I am.",
      assumption: "I do care. That's a strange thing to have to say to you. Ask me what I thought I was doing.",
      sorryBut: "You can be mad. Just don't apologize and then prosecute me in the next clause.",
      sorry: "Thank you. I still want to explain what I thought the comment meant, if you'll hear it. And I'll take the page down.",
      honesty: "Okay. That's specific. I can take it down today. I need you to tell me what credit looks like to you, not just that I failed.",
      kindness: "I know you didn't have to be decent about it. I'm embarrassed. Tell me the part you still need.",
      boundary: "Yeah. You don't have to soften it. I'd rather have the real line than a polite one.",
      appease: "Don't wave it off. If it bothered you, it bothered you. “It's fine” leaves the page up.",
      specific: "The portfolio page. Yeah. I posted it last night. Say what you need to happen to it.",
      curiosity: "You really don't know? I thought the note on the doc was you handing it over. Maybe I wanted that to be true.",
      repairSorry: "I hear the apology. I'll take the page down today. Can we also say, out loud, what the doc comment means from now on?",
      repairPattern: "If you came back to call me a thief again, we already did that part. I don't need an encore.",
      defaultLine: "I'm not going to agree I stole from you just so this ends. Tell me what you saw, and what you want.",
    },
  },
  {
    slug: "after-the-client",
    keywords: ["client", "meeting", "feedback", "recommendation"],
    initial: { trust: 44, frustration: 32, openness: 36, unresolved: 60, boundary: 70, repair: 22 },
    opening: "You wanted to talk about the client meeting. I'm listening.",
    voice: "Calm, low temperature, precise. You do not grovel. You do not smirk.",
    hidden:
      "The client had already flagged the error before the user walked in. You spoke in the room because you were once blindsided in a meeting and you overcorrected. The content of the correction stands. The setting cost them something. You will say the client part and your overcorrection only if they can separate the note from the humiliation.",
    revealLine:
      "The client had already flagged the error before you walked in. I said it in the room because I was blindsided like that once, and I overcorrected. The note itself stands. The way I did it cost you. I see that.",
    afterReveal:
      "So I protected myself from a surprise and handed you one. That part is mine. The recommendation still needs to change. Both of those can stay on the table.",
    repairOpen:
      "Last time you said “{quote}” I kept that. If we are continuing, I need us to separate the correction from the room it happened in.",
    repairFallback:
      "You came back. I am still willing to talk about the meeting. I am not willing to withdraw the correction.",
    stallLine:
      "I am going to stop this here. I will discuss the work. I will not absorb contempt in order to prove I care.",
    bank: {
      contempt: "No. You can be angry about the meeting. You cannot speak to me that way. We can reschedule.",
      demand: "I will not perform remorse so the meeting can feel resolved. The feedback stands.",
      accusation: "If you want to say I handled the room badly, say that. Don't make it a trial about my character.",
      accusationCurious: "Ask me about the timing, or tell me I humiliated you. The first one I can answer cleanly.",
      assumption: "I do respect you. I also think the recommendation was wrong. Those are not in conflict.",
      sorryBut: "You are sorry for the tone, and you are still asking me to take the note back. I won't.",
      sorry: "I hear it. I am not asking you to be sorry for raising this. I am asking you not to confuse the setting with the substance.",
      honesty: "That is fair to say. The setting was costly. I am not going to pretend the recommendation was sound in order to repair the setting.",
      kindness: "Thank you. That makes this easier to stay in. The client still needs a corrected recommendation.",
      boundary: "Good. Then we can talk about a different way to do the next correction without you managing my feelings.",
      appease: "You do not have to make this pleasant. Pleasant is how the actual objection disappears.",
      specific: "Yes. The moment in the meeting. Tell me what you needed instead of what I did.",
      curiosity: "You want the reason. I thought saying it then stopped a worse surprise later. I am willing to hear why that was the wrong trade.",
      repairSorry: "Thank you for coming back this way. I can own the room. I still need the recommendation revised. Can we plan that without a second injury?",
      repairPattern: "This is the same heat as last time. I will talk about process. I will not be indicted.",
      defaultLine: "I am listening, and I am not going to agree the correction itself was the harm. What do you want to be different?",
    },
  },
  {
    slug: "quiet-kitchen",
    keywords: ["dishes", "kitchen", "finals", "friends", "apartment", "thursday"],
    initial: { trust: 55, frustration: 40, openness: 32, unresolved: 64, boundary: 48, repair: 26 },
    opening: "You've been quiet since Thursday. I thought you wanted space. Did I read that wrong?",
    voice: "Soft, concrete, tired. You talk about the apartment, not about vibes. You are not fragile, and you are not a villain.",
    hidden:
      "You overheard them on the phone sighing about people leaving dishes, and you thought it was about you. You started eating in your room to stay out of the way. You were not punishing them for the finals request. You will say this if they get curious instead of accusing you of icing them out.",
    revealLine:
      "I heard you on the phone about people leaving dishes, and I thought you meant me. So I started eating in my room. I wasn't icing you out. I was trying not to be in the way. If that isn't what you said, I need you to tell me what you did mean.",
    afterReveal:
      "I made up a story and then lived in it. You still asked me to keep the place quiet, and I need that request to be about the week, not about whether I'm welcome.",
    repairOpen:
      "Last time you said “{quote}” I haven't forgotten the wording. I'm in the kitchen. That's on purpose.",
    repairFallback:
      "You came back in. Good. I'd rather we use words than another week of goodnights from doorways.",
    stallLine:
      "I'm going to my room, and not as a punishment. I won't be called dramatic for being hurt. We can try again when this is kinder.",
    bank: {
      contempt: "No. I'm not going to be insulted in my own kitchen. We can stop.",
      demand: "Don't tell me to get over a silence you haven't even asked me about yet.",
      accusation: "So I was punishing you. That's the story you brought in. I don't recognize it.",
      accusationCurious: "You can ask why I've been in my room. You don't have to arrive with the reason already picked.",
      assumption: "I wasn't icing you out. That's the part you decided without me.",
      sorryBut: "I can hear the sorry. I can also hear you still arguing with the feeling. Pick one for a second.",
      sorry: "Thank you. I'm not asking us to be instantly easy. I do want to know what you actually needed this week.",
      honesty: "Okay. That's clearer. Quiet during finals I can do. Being treated like a problem I won't.",
      kindness: "I didn't know you were worried, not angry. That matters. I still want to say what I thought I heard.",
      boundary: "Thank you. I don't owe a full autobiography of the week. I do owe you the truth about the kitchen.",
      appease: "“It's fine” leaves me eating on my bed. If it isn't fine, I need the real sentence.",
      specific: "The friends, the finals, the dishes. Tell me which one you were actually talking about.",
      curiosity: "I've been in my room because I thought you wanted the kitchen without me in it. Was that true, or did I invent it?",
      repairSorry: "I believe you. Let's make the rest of finals boring and specific: quiet hours, and we eat out here again.",
      repairPattern: "If you came back to tell me I punished you, I already lived with that version. I don't want a second week of it.",
      defaultLine: "I asked if I read you wrong. You can answer that. I'm not going to agree that I was cruel just to end the quiet.",
    },
  },
];

export function getScript(slug: string) {
  return scripts.find((script) => script.slug === slug);
}

const sequels: Record<string, string[]> = {
  "empty-slide": [
    "Midnight is a real time. I can start the method slides. I can't promise they'll be good if I start from zero. Which three do you mean?",
    "You've said what you need. I still haven't told you why the week went missing. Do you want that, or only the file?",
  ],
  "the-joke": [
    "Saying it was a joke again doesn't put the message back. Who else is still in that chat?",
    "I heard you. I'm asking what you are going to do, not whether you feel bad.",
  ],
  "office-hours": [
    "A grade is a number. I'm asking about the claim. Which sentence are you willing to defend?",
    "You can want the grade and still answer the question. What did the source actually say?",
  ],
  unfinished: [
    "The page is already in the portfolio. Telling me it was ours doesn't take it down. What do you want me to do with it?",
    "I don't want to lose you over a layout. I also don't want to pretend I asked. What would make this fair?",
  ],
  "after-the-client": [
    "I corrected you in the room. That part stands. What do you want the next meeting to sound like?",
    "If this is about how I said it, say that. If it's about the fact, we should not blur those.",
  ],
  "quiet-kitchen": [
    "Finals can be quiet. Being avoided is different. Which one was this week?",
    "I can come back to the table. I need to know you want me there, not just the dishes done.",
  ],
};

export function scriptedLine(
  script: Script,
  args: {
    signals: Signals;
    revealed: boolean;
    justRevealed: boolean;
    repair: boolean;
    stalled: boolean;
    prior?: string[];
  },
) {
  if (args.stalled) return script.stallLine;
  if (args.justRevealed) return ask(script, script.revealLine);
  const bank = script.bank;
  const chosen = pick(script, args, bank);
  return fresh(script, chosen, args.prior ?? []);
}

function pick(
  script: Script,
  args: { signals: Signals; revealed: boolean; repair: boolean },
  bank: LineBank,
) {
  if (args.repair && args.signals.apology && !args.signals.justification) return bank.repairSorry;
  if (args.repair && (args.signals.accusation || args.signals.contempt)) return bank.repairPattern;
  if (args.signals.contempt) return bank.contempt;
  if (args.signals.demandForgiveness) return bank.demand;
  if (args.signals.apology && args.signals.justification) return bank.sorryBut;
  if (args.signals.apology) return bank.sorry;
  if (args.signals.assumption && !args.signals.curiosity) return bank.assumption;
  if (args.signals.accusation && args.signals.curiosity) return bank.accusationCurious;
  if (args.signals.accusation) return bank.accusation;
  if (args.signals.appeasement && !args.signals.honesty) return bank.appease;
  if (args.signals.respectBoundary) return bank.boundary;
  if (args.revealed && (args.signals.kindness || args.signals.curiosity)) return script.afterReveal;
  if (args.signals.kindness) return bank.kindness;
  if (args.signals.honesty) return bank.honesty;
  if (args.signals.specific) return bank.specific;
  if (args.signals.curiosity) return bank.curiosity;
  if (args.revealed) return script.afterReveal;
  return bank.defaultLine;
}

function fresh(script: Script, line: string, prior: string[]) {
  const spoken = ask(script, line);
  if (!prior.includes(spoken)) return spoken;
  const next = (sequels[script.slug] ?? []).map((item) => ask(script, item)).find((item) => !prior.includes(item));
  return next ?? spoken;
}

const nudges: Record<string, string> = {
  "empty-slide": "What do you actually need from me?",
  "the-joke": "What are you going to do about the chat?",
  "office-hours": "Which sentence do you want to defend?",
  unfinished: "What do you want to happen to that page?",
  "after-the-client": "What do you want to be different next time?",
  "quiet-kitchen": "Did I read you wrong, or not?",
};

function ask(script: Script, line: string) {
  if (line.includes("?")) return line;
  const nudge = nudges[script.slug];
  if (!nudge) return line;
  return `${line.replace(/\s+$/, "")} ${nudge}`;
}

export function repairOpening(script: Script, sharpest: string) {
  if (!sharpest) return ask(script, script.repairFallback);
  const quote = sharpest.replace(/\s+/g, " ").trim().slice(0, 140);
  return ask(script, script.repairOpen.replace("{quote}", quote));
}
