// A backend "route": the website (or you, with a tool like curl) sends a POST
// request to /api/seat, and this code runs on the server, NOT in the browser.
// That matters because your API key must stay secret on the server.

import Anthropic from "@anthropic-ai/sdk";
import { runSeat, SEATS, MissingKeyError, type Seat } from "@/lib/council";

// Give Claude up to 5 minutes; a careful answer can take a while.
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const idea = typeof body?.idea === "string" ? body.idea.trim() : "";
  const seat = body?.seat ?? "believer";

  // Check the input before spending money on an AI call.
  if (!idea) {
    return Response.json({ error: "Please send an idea." }, { status: 400 });
  }
  if (idea.length > 2000) {
    return Response.json({ error: "Keep the idea under 2000 characters." }, { status: 400 });
  }
  if (!SEATS.includes(seat)) {
    return Response.json({ error: `Seat must be one of: ${SEATS.join(", ")}` }, { status: 400 });
  }

  try {
    const argument = await runSeat(seat as Seat, idea);
    return Response.json({ seat, argument });
  } catch (error) {
    // Turn confusing errors into plain messages.
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
}
