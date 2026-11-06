// The "brain" of the app: this file talks to Claude.
// It loads a seat's instructions from prompts/ and sends your idea to Claude.

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

// The four seats. Each name matches a file in prompts/ (e.g. prompts/believer.md).
export const SEATS = ["believer", "skeptic", "investor", "judge"] as const;
export type Seat = (typeof SEATS)[number];

// Which Claude model every seat uses.
const MODEL = "claude-opus-5-5";

// How deeply each seat thinks: "low", "medium", "high", "xhigh", or "max".
const EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"] as const;
const EFFORT = (EFFORT_LEVELS as readonly string[]).includes(process.env.COUNCIL_EFFORT ?? "")
  ? (process.env.COUNCIL_EFFORT as (typeof EFFORT_LEVELS)[number])
  : "xhigh";

// Create the Claude client. It reads your key from the ANTHROPIC_API_KEY
// environment variable (in .env.local). The key never goes in the code.
// We check for the key first so a missing key gives a plain-English error.
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingKeyError();
  }
  return new Anthropic();
}

export class MissingKeyError extends Error {
  constructor() {
    super("No API key found. Add ANTHROPIC_API_KEY to .env.local and restart the app.");
  }
}

// The two modes. Each one has its own instructions in prompts/modes/.
export const MODES = ["side-hustle", "venture"] as const;
export type Mode = (typeof MODES)[number];

// Read a file from the prompts/ folder.
function readPrompt(name: string): string {
  return fs.readFileSync(path.join(process.cwd(), "prompts", name), "utf8");
}

// A seat's full instructions = its personality + the rules for the chosen mode.
function systemPrompt(seat: Seat, mode: Mode): string {
  return `${readPrompt(`${seat}.md`)}\n\n${readPrompt(`modes/${mode}.md`)}`;
}

// The note every seat gets: we only give the idea, nothing about the founder.
const IDEA_ONLY_NOTE =
  "No budget, timeline, location, or founder details are given. Judge the idea on its own merits. " +
  "Do not ask for more details.";

// The three seats that argue first. The Judge goes last.
export const ARGUING_SEATS = ["believer", "skeptic", "investor"] as const;
export type ArguingSeat = (typeof ARGUING_SEATS)[number];
export type Arguments = Record<ArguingSeat, string>;

// Live updates we send to the browser while a seat is working.
export type Progress = { type: "searching" } | { type: "text"; text: string };
export type OnProgress = (p: Progress) => void;

// The one function that actually calls Claude. Every seat uses it.
async function askClaude(seat: Seat, mode: Mode, userMessage: string, onProgress: OnProgress): Promise<string> {
  const client = getClient();
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: userMessage }];
  let fullText = "";

  // Web search runs on Anthropic's servers. If Claude does a lot of searching,
  // the API pauses ("pause_turn") and we send it back so it can keep going.
  for (let round = 0; round < 4; round++) {
    // We use streaming: Claude's answer arrives a few words at a time, and we
    // pass each piece on to the browser so you can watch the seat "type".
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      // How hard Claude thinks before answering. "xhigh" = very deep thinking
      // (slower and costs more, but much better reasoning). You can change it
      // without touching code by setting COUNCIL_EFFORT (e.g. to "high").
      output_config: { effort: EFFORT },
      // Let each seat look things up on the web: real competitors, prices, data.
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: seat === "judge" ? 3 : 6 }],
      // If Claude ever declines a request, the API automatically retries it on
      // a backup model instead of just failing.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // The system prompt tells Claude which seat it's playing and which mode.
      system: systemPrompt(seat, mode),
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_start" && event.content_block.type === "server_tool_use") {
        onProgress({ type: "searching" });
      }
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        onProgress({ type: "text", text: event.delta.text });
      }
    }
    // finalMessage() gives us the whole answer once the stream is finished.
    const response = await stream.finalMessage();

    if (response.stop_reason === "refusal") {
      throw new Error("Claude declined to answer this idea.");
    }

    // Claude's reply comes back as a list of "blocks". We only want the text.
    // (With web search, one sentence can be split across blocks because of
    // citations, so we join them with no separator.)
    fullText += response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    return fullText.trim();
  }
  throw new Error("The council took too long researching. Try again.");
}

// Opening argument from the Believer, Skeptic, or Investor.
// Each one only sees the idea, NOT the others' work, so nobody is biased.
export async function runSeat(seat: ArguingSeat, idea: string, mode: Mode, onProgress: OnProgress): Promise<string> {
  return askClaude(
    seat,
    mode,
    `Business idea: ${idea}\n\n${IDEA_ONLY_NOTE}\n\nGive your full council argument as described in your role.`,
    onProgress,
  );
}

// The Judge reads all three arguments and gives the verdict.
export async function runJudge(idea: string, mode: Mode, args: Arguments, onProgress: OnProgress): Promise<string> {
  return askClaude(
    "judge",
    mode,
    `Business idea: ${idea}\n\n${IDEA_ONLY_NOTE}\n\n` +
      `=== BELIEVER ===\n${args.believer}\n\n` +
      `=== SKEPTIC ===\n${args.skeptic}\n\n` +
      `=== INVESTOR ===\n${args.investor}\n\n` +
      "Deliver your full verdict as described in your role.",
    onProgress,
  );
}
