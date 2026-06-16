import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY manquant dans .env.local");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini";
