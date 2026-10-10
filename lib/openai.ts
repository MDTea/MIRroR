import "server-only";

import OpenAI from "openai";

export function modelName() {
  return process.env.ASU_OPENAI_MODEL || "kimi-k2-7-code";
}

export function getClient() {
  const apiKey = process.env.ASU_OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    baseURL: process.env.ASU_OPENAI_BASE_URL || "https://openai.rc.asu.edu/v1",
    apiKey,
  });
}
