// POST /api/seat  { idea, seat, mode }  ->  a live stream of the seat's answer (see lib/live.ts)
// Runs ONE of the arguing seats (believer, skeptic, investor) on the server,
// where the API key stays secret. The website calls this 3 times at once.

import { runSeat, ARGUING_SEATS, type ArguingSeat } from "@/lib/council";
import { checkIdea, checkMode } from "@/lib/errors";
import { liveResponse } from "@/lib/live";
import { checkAccess } from "@/lib/access";

// How long the server may work on one request, in seconds. 300 (5 minutes)
// is the most Vercel's free plan allows.
export const maxDuration = 300;

export async function POST(request: Request) {
  // Stop strangers from spending your API credits (see lib/access.ts).
  const denied = checkAccess(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);

  // Check the input before spending money on an AI call.
  const idea = checkIdea(body?.idea);
  if (idea instanceof Response) return idea;

  const seat = body?.seat ?? "believer";
  if (!ARGUING_SEATS.includes(seat)) {
    return Response.json({ error: `Seat must be one of: ${ARGUING_SEATS.join(", ")}` }, { status: 400 });
  }

  // Stream the seat's answer to the browser as it's written.
  const mode = checkMode(body?.mode);
  return liveResponse((onProgress) => runSeat(seat as ArguingSeat, idea, mode, onProgress));
}
