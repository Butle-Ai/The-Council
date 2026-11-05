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

// The client reads your key from the ANTHROPIC_API_KEY environment variable
// (in .env.local when running on your computer). The key never goes in the code.
const client = new Anthropic();

// Read a seat's instructions (its "system prompt") from the prompts/ folder.
function loadPrompt(seat: Seat): string {
  const file = path.join(process.cwd(), "prompts", `${seat}.md`);
  return fs.readFileSync(file, "utf8");
}

// Send an idea to one seat and get back its written argument.
export async function runSeat(seat: Seat, idea: string): Promise<string> {
  const response = await client.beta.messages.create({
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
    // The user message is the idea itself.
    messages: [
      {
        role: "user",
        content:
          `Business idea: ${idea}\n\n` +
          "No budget, timeline, location, or founder details are given. Judge the idea on its own merits, " +
          "assuming a typical small founding team with normal access to funding. Do not ask for more details.\n\n" +
          "Give your full council argument as described in your role.",
      },
    ],
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
