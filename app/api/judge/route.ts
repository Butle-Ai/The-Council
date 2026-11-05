// POST /api/judge  { idea, arguments: { believer, skeptic, investor } }  ->  { verdict }
// The Judge reads all three arguments and gives the final verdict.

import { runJudge, ARGUING_SEATS, type Arguments } from "@/lib/council";
import { errorResponse, checkIdea } from "@/lib/errors";

export const maxDuration = 300;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const idea = checkIdea(body?.idea);
  if (idea instanceof Response) return idea;

  // Make sure all three arguments are there before asking the Judge.
  const args = body?.arguments ?? {};
  for (const seat of ARGUING_SEATS) {
    if (typeof args[seat] !== "string" || !args[seat].trim()) {
      return Response.json({ error: `Missing the ${seat}'s argument.` }, { status: 400 });
    }
    if (args[seat].length > 20000) {
      return Response.json({ error: `The ${seat}'s argument is too long.` }, { status: 400 });
    }
  }

  try {
    const verdict = await runJudge(idea, args as Arguments);
    return Response.json({ verdict });
  } catch (error) {
    return errorResponse(error);
  }
}
