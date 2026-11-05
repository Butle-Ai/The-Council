// Sends a seat's work to the browser LIVE, one line of JSON at a time:
//   {"type":"searching"}            the seat is searching the web
//   {"type":"text","text":"..."}    a few more words of the answer
//   {"type":"ping"}                 "still working" (every 10 seconds)
//   {"type":"done","text":"..."}    the full, finished answer
//   {"type":"error","error":"..."}  something went wrong
// The pings matter: some connections (like Codespaces) cut off a request that
// stays silent for too long, and deep thinking can be silent for minutes.

import type { OnProgress } from "@/lib/council";
import { friendlyError } from "@/lib/errors";

export function liveResponse(work: (onProgress: OnProgress) => Promise<string>): Response {
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      const ping = setInterval(() => send({ type: "ping" }), 10_000);
      try {
        const text = await work((progress) => send(progress));
        send({ type: "done", text });
      } catch (error) {
        console.error(error);
        send({ type: "error", error: friendlyError(error).message });
      } finally {
        clearInterval(ping);
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
