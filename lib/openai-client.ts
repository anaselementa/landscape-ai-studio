import OpenAI from "openai";

function requireOpenAiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Add it to your Vercel environment variables.");
  }

  return process.env.OPENAI_API_KEY;
}

export function getOpenAI() {
  return new OpenAI({
    apiKey: requireOpenAiKey()
  });
}

export const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
