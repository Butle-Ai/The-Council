// POST /api/judge  { idea, mode, arguments: { believer, skeptic, investor } }  ->  a live stream of the verdict
// The Judge reads all three arguments and gives the final verdict.

import { runJudge, ARGUING_SEATS, type Arguments } from "@/lib/council";
import { checkIdea, checkMode } from "@/lib/errors";
import { liveResponse } from "@/lib/live";
import { checkAccess } from "@/lib/access";

// 300 seconds (5 minutes) is the most Vercel's free plan allows.
export const maxDuration = 300;

export async function POST(request: Request) {
  // Stop strangers from spending your API credits (see lib/access.ts).
  const denied = checkAccess(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);

  const idea = checkIdea(body?.idea);
  if (idea instanceof Response) return idea;

  // Make sure all three arguments are there before asking the Judge.
  const args = body?.arguments ?? {};
  for (const seat of ARGUING_SEATS) {
    if (typeof args[seat] !== "string" || !args[seat].trim()) {
      return Response.json({ error: `Missing the ${seat}'s argument.` }, { status: 400 });
    }
    if (args[seat].length > 40000) {
      return Response.json({ error: `The ${seat}'s argument is too long.` }, { status: 400 });
    }
  }

  const mode = checkMode(body?.mode);
  return liveResponse((onProgress) => runJudge(idea, mode, args as Arguments, onProgress));
}
