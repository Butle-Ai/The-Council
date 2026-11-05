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

// Read a seat's instructions (its "system prompt") from the prompts/ folder.
function loadPrompt(seat: Seat): string {
  const file = path.join(process.cwd(), "prompts", `${seat}.md`);
  return fs.readFileSync(file, "utf8");
}

// The note every seat gets: we only give the idea, nothing about the founder.
const IDEA_ONLY_NOTE =
  "No budget, timeline, location, or founder details are given. Judge the idea on its own merits, " +
  "assuming a typical small founding team with normal access to funding. Do not ask for more details.";

// The three seats that argue first. The Judge goes last.
export const ARGUING_SEATS = ["believer", "skeptic", "investor"] as const;
export type ArguingSeat = (typeof ARGUING_SEATS)[number];
export type Arguments = Record<ArguingSeat, string>;

// The one function that actually calls Claude. Every seat uses it:
// "seat" picks the system prompt, "userMessage" is what the seat is asked.
async function askClaude(seat: Seat, userMessage: string): Promise<string> {
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // How hard Claude thinks before answering. "high" = careful, thorough answers.
    output_config: { effort: "high" },
    // If Claude ever declines a request, the API automatically retries it on
    // a backup model instead of just failing.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    // The system prompt tells Claude which seat it's playing.
    system: loadPrompt(seat),
    messages: [{ role: "user", content: userMessage }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined to answer this idea.");
  }

  // Claude's reply comes back as a list of "blocks". We only want the text ones.
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

// Opening argument from the Believer, Skeptic, or Investor.
// Each one only sees the idea, NOT the others' work, so nobody is biased.
export async function runSeat(seat: ArguingSeat, idea: string): Promise<string> {
  return askClaude(
    seat,
    `Business idea: ${idea}\n\n${IDEA_ONLY_NOTE}\n\nGive your full council argument as described in your role.`,
  );
}

// The Judge reads all three arguments and gives the verdict.
export async function runJudge(idea: string, args: Arguments): Promise<string> {
  return askClaude(
    "judge",
    `Business idea: ${idea}\n\n${IDEA_ONLY_NOTE}\n\n` +
      `=== BELIEVER ===\n${args.believer}\n\n` +
      `=== SKEPTIC ===\n${args.skeptic}\n\n` +
      `=== INVESTOR ===\n${args.investor}\n\n` +
      "Deliver your full verdict as described in your role.",
  );
}
