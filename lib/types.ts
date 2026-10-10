export const STATE_KEYS = [
  "trust",
  "frustration",
  "openness",
  "unresolved",
  "boundary",
  "repair",
] as const;

export type StateKey = (typeof STATE_KEYS)[number];

export type RelationshipState = Record<StateKey, number>;

export type SignalKey =
  | "accusation"
  | "curiosity"
  | "apology"
  | "justification"
  | "honesty"
  | "kindness"
  | "respectBoundary"
  | "demandForgiveness"
  | "contempt"
  | "assumption"
  | "specific"
  | "appeasement"
  | "question";

export type Signals = Record<SignalKey, number>;

export type Expression =
  | "guarded"
  | "bristling"
  | "listening"
  | "open"
  | "steady"
  | "firm";

export type Act = "talk" | "mirror" | "reflect" | "repair" | "feedback";

export type Voice = "live" | "house";

export type Message = {
  id: string;
  role: "user" | "character" | "stage" | "mirror-self";
  text: string;
  at: string;
  signals?: Signals;
  delta?: Partial<RelationshipState>;
  voice?: Voice;
  points?: number;
};

export type ResponseFeedback = {
  messageId: string;
  text: string;
  reply: string;
  pros: string[];
  cons: string[];
  tryInstead: string;
};

export type Feedback = {
  summary: string;
  pros: string[];
  cons: string[];
  responses: ResponseFeedback[];
  createdAt: string;
};

export type CustomScene = {
  problem: string;
  scene: ScenePublic;
  voice: string;
  opening: string;
  hidden: string;
  revealLine: string;
  afterReveal: string;
  keywords: string[];
};

export type SceneEvent = {
  id: string;
  label: string;
  detail: string;
};

export type TurningPoint = {
  messageId: string;
  quote: string;
  note: string;
};

export type ReflectionPrompt = {
  id: string;
  question: string;
  answer: string;
};

export type Thread = {
  id: string;
  slug: string;
  act: Act;
  state: RelationshipState;
  messages: Message[];
  mirrorMessages: Message[];
  totals: Signals;
  revealed: boolean;
  events: SceneEvent[];
  turningPoint: TurningPoint | null;
  reflection: ReflectionPrompt[];
  shards: string[];
  actsCompleted: Act[];
  repairVisits: number;
  stalled: boolean;
  sharpest: string;
  voice: Voice;
  createdAt: string;
  updatedAt: string;
  points?: number;
  feedback?: Feedback | null;
  custom?: CustomScene;
};

export type Cue = {
  id: string;
  label: string;
  text: string;
};

export type ScenePublic = {
  slug: string;
  numeral: string;
  title: string;
  minutes: string;
  logline: string;
  setting: string;
  premise: string;
  agreeable: string;
  character: {
    name: string;
    pronouns: string;
    role: string;
    aim: string;
    boundary: string;
  };
  cues: Cue[];
};
