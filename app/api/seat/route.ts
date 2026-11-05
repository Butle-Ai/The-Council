// POST /api/seat  { idea, seat }  ->  { seat, argument }
// Runs ONE of the arguing seats (believer, skeptic, investor) on the server,
// where the API key stays secret. The website calls this 3 times at once.

import { runSeat, ARGUING_SEATS, type ArguingSeat } from "@/lib/council";
import { errorResponse, checkIdea } from "@/lib/errors";

// Give Claude up to 5 minutes; a careful answer can take a while.
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  // Check the input before spending money on an AI call.
  const idea = checkIdea(body?.idea);
  if (idea instanceof Response) return idea;

  const seat = body?.seat ?? "believer";
  if (!ARGUING_SEATS.includes(seat)) {
    return Response.json({ error: `Seat must be one of: ${ARGUING_SEATS.join(", ")}` }, { status: 400 });
  }

  try {
    const argument = await runSeat(seat as ArguingSeat, idea);
    return Response.json({ seat, argument });
  } catch (error) {
    return errorResponse(error);
  }
}
