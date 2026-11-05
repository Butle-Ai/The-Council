// Turns any error into a plain-English message the website can show.
// Both backend routes (/api/seat and /api/judge) use this.

import Anthropic from "@anthropic-ai/sdk";
import { MissingKeyError } from "@/lib/council";

export function errorResponse(error: unknown): Response {
  if (error instanceof MissingKeyError) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return Response.json({ error: "Your API key was rejected. Make sure the full key is in .env.local." }, { status: 500 });
  }
  if (error instanceof Anthropic.RateLimitError) {
    return Response.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  }
  if (error instanceof Anthropic.BadRequestError && /credit balance/i.test(error.message)) {
    return Response.json({ error: "Your Anthropic account is out of credits. Add some in the console." }, { status: 402 });
  }
  if (error instanceof Anthropic.APIError) {
    return Response.json({ error: `Claude API error (${error.status}): ${error.message}` }, { status: 502 });
  }
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return Response.json({ error: message }, { status: 500 });
}

// Shared check for the idea text, so both routes reject bad input the same way.
export function checkIdea(idea: unknown): string | Response {
  const text = typeof idea === "string" ? idea.trim() : "";
  if (!text) return Response.json({ error: "Please send an idea." }, { status: 400 });
  if (text.length > 2000) return Response.json({ error: "Keep the idea under 2000 characters." }, { status: 400 });
  return text;
}
