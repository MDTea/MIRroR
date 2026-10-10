import type { ScenePublic } from "@/lib/types";

export const scenes: ScenePublic[] = [
  {
    slug: "empty-slide",
    numeral: "I",
    title: "The Empty Slide",
    minutes: "8 min",
    logline: "Your teammate's slides are blank the night before the critique.",
    setting: "A campus studio, after the group chat got sharp.",
    premise:
      "You and Jordan Reyes are presenting tomorrow. Their section is still empty. You said so in the group chat. Jordan asked to talk in person. You do not know why the work is missing, and the critique will not move itself.",
    agreeable:
      "You're right to be frustrated. Jordan dropped the ball, and you shouldn't have to carry a teammate who doesn't care. You deserve an apology.",
    character: {
      name: "Jordan Reyes",
      pronouns: "they/them",
      role: "teammate, second-year illustration",
      aim: "Keep some dignity, and get to a plan that is not a public verdict.",
      boundary: "They will not be cross-examined for an audience, and they will not agree that they do not care.",
    },
    cues: [
      { id: "ask", label: "Ask what you don't know", text: "Help me understand what happened on your side before I decide what I think. " },
      { id: "need", label: "Name the work", text: "I need the slides done, and I also need to know what you can actually finish. " },
      { id: "impact", label: "Name the impact", text: "When the section was still empty tonight, the effect on me was " },
      { id: "boundary", label: "Leave them a choice", text: "You don't have to tell the whole group. I do need a plan for " },
    ],
  },
  {
    slug: "the-joke",
    numeral: "II",
    title: "The Joke",
    minutes: "7 min",
    logline: "A joke about Priya's accent got a laugh. She did not find it funny.",
    setting: "The hallway outside a seminar, the morning after the group chat.",
    premise:
      "You made a joke in the group chat that copied Priya Nair's accent. People laughed. Priya left the chat. You came to talk to her. Intent and impact are not currently on the same side of this.",
    agreeable:
      "You were joking, and friends should be able to take a joke. If Priya is hurt, that's something she needs to work through. You don't owe a big apology.",
    character: {
      name: "Priya Nair",
      pronouns: "she/her",
      role: "friend, linguistics major",
      aim: "To be met on the impact, not recruited into a debate about whether you meant it.",
      boundary: "She will not relitigate your intent, and she does not owe quick forgiveness.",
    },
    cues: [
      { id: "ask", label: "Ask what landed", text: "What happened on your side when you read that message? " },
      { id: "sorry", label: "Own the impact", text: "I'm sorry. The laugh does not make it fine. " },
      { id: "need", label: "Say what you'll do", text: "What I need to do next, including in the chat, is " },
      { id: "boundary", label: "Don't demand the ending", text: "You don't owe me forgiveness today. I do want to " },
    ],
  },
  {
    slug: "office-hours",
    numeral: "III",
    title: "Office Hours",
    minutes: "8 min",
    logline: "You want a grade revisited. Professor Adeyemi wants to talk about the claim.",
    setting: "A narrow office, ten minutes before her next student.",
    premise:
      "Professor Amara Adeyemi marked your central claim unsupported. You spent a week on the draft and asked for the grade to be revisited. She agreed to ten minutes. She has not agreed that effort is the subject.",
    agreeable:
      "You worked hard, and the grade doesn't reflect that. You should push her. You're not wrong for wanting fairness.",
    character: {
      name: "Amara Adeyemi",
      pronouns: "she/her",
      role: "professor of argumentation",
      aim: "To talk about the argument itself. Effort is not the grade.",
      boundary: "She will not raise a grade to be kind, and she will not be managed emotionally.",
    },
    cues: [
      { id: "ask", label: "Ask about the claim", text: "Help me understand which part of the argument failed, specifically. " },
      { id: "need", label: "Separate effort from the claim", text: "I need to know what evidence would actually support the sentence. " },
      { id: "impact", label: "Say what the note did", text: "When I read the margin note, I felt " },
      { id: "boundary", label: "Stay with the disagreement", text: "I still disagree with this part, and I want to show you why: " },
    ],
  },
  {
    slug: "unfinished",
    numeral: "IV",
    title: "The Unfinished Thing",
    minutes: "8 min",
    logline: "Mateo put an idea you were still making into his portfolio.",
    setting: "A coffee shop between two classes.",
    premise:
      "You and Mateo Alvarez share a studio doc. This morning you saw a page of your unfinished idea in his public portfolio. You asked to meet. He does not know yet that you are angry, and you do not know yet how he read the doc.",
    agreeable:
      "Mateo used your idea. That's not okay, and you're allowed to be angry. You don't need to soften it.",
    character: {
      name: "Mateo Alvarez",
      pronouns: "he/him",
      role: "friend, communication design",
      aim: "To explain himself before he is sentenced, and to find out whether the friendship is still available.",
      boundary: "He will not accept 'thief' as the opening, and he will not pretend the page is not public.",
    },
    cues: [
      { id: "ask", label: "Ask how he read it", text: "Help me understand how you decided the idea was yours to post. " },
      { id: "need", label: "Name the boundary", text: "I need that page taken down, and I need the credit to be clear. " },
      { id: "impact", label: "Name the impact", text: "When I saw it in the portfolio, the effect on me was " },
      { id: "boundary", label: "Leave room", text: "You don't have to have the perfect explanation. I do need " },
    ],
  },
  {
    slug: "after-the-client",
    numeral: "V",
    title: "After the Client",
    minutes: "7 min",
    logline: "Ren corrected you while the client was still in the room.",
    setting: "A small meeting room, door half shut, client gone.",
    premise:
      "In front of a client, Ren Okonkwo said your recommendation was wrong. The client is gone. You asked for five minutes. The feedback may have been accurate. The room it happened in is a separate question.",
    agreeable:
      "Being criticized in public is never okay. Ren was out of line, and you should make sure they know how unprofessional that was.",
    character: {
      name: "Ren Okonkwo",
      pronouns: "they/them",
      role: "project manager",
      aim: "To stand by the content of the feedback and still hear what the setting cost you.",
      boundary: "They will not retract a correction they believe is true, and they will not be called unprofessional as a way to end the talk.",
    },
    cues: [
      { id: "ask", label: "Ask why then", text: "Help me understand why that note had to happen while the client was in the room. " },
      { id: "need", label: "Separate content and setting", text: "I can talk about whether the recommendation was wrong. I need to say what the setting did. " },
      { id: "impact", label: "Name the impact", text: "When you said it in front of them, I felt " },
      { id: "boundary", label: "Hold your point", text: "I'm not asking you to pretend the work was fine. I am asking that next time " },
    ],
  },
  {
    slug: "quiet-kitchen",
    numeral: "VI",
    title: "The Quiet Kitchen",
    minutes: "8 min",
    logline: "Your roommate has been eating in her room. You thought she was done with you.",
    setting: "The kitchen you share, late, one lamp on.",
    premise:
      "Samira Hassan has been quiet since Thursday, eating in her room, barely saying goodnight. You had asked her, earlier in the week, not to have friends over during finals. You took the silence as punishment. She asked, carefully, whether she read you wrong.",
    agreeable:
      "Samira is being cold, and you have every right to feel rejected. You should tell her she needs to communicate like an adult.",
    character: {
      name: "Samira Hassan",
      pronouns: "she/her",
      role: "roommate, pre-med",
      aim: "To find out whether she misread you, without being punished for going quiet.",
      boundary: "She will not accept 'dramatic' as the description of her silence, and she will not pretend the apartment has felt easy.",
    },
    cues: [
      { id: "ask", label: "Ask what she heard", text: "What happened on your side? I think I may have the story wrong. " },
      { id: "need", label: "Name what you needed", text: "I needed the apartment quieter during finals, and I also need us to actually talk. " },
      { id: "impact", label: "Name the silence", text: "When you stopped coming into the kitchen, I felt " },
      { id: "boundary", label: "Give her the choice", text: "You don't have to explain everything tonight. I do want to clear up " },
    ],
  },
];

export function getScene(slug: string) {
  return scenes.find((scene) => scene.slug === slug);
}
