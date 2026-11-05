"use client";
// "use client" means this code runs in the BROWSER, so it can react to typing
// and clicks. It never sees the API key; it just asks our backend routes.
//
// How a council session runs:
//   1. Believer, Skeptic and Investor all get the idea AT THE SAME TIME
//      (3 calls to /api/seat in parallel), so no seat sees the others' work.
//   2. When all three are done, their arguments go to the Judge (/api/judge).

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type SeatId = "believer" | "skeptic" | "investor" | "judge";
type Status = "waiting" | "thinking" | "done" | "error";

const SEATS: { id: SeatId; label: string; color: string }[] = [
  { id: "believer", label: "The Believer", color: "var(--believer)" },
  { id: "skeptic", label: "The Skeptic", color: "var(--skeptic)" },
  { id: "investor", label: "The Investor", color: "var(--investor)" },
  { id: "judge", label: "The Judge", color: "var(--judge)" },
];
const ARGUING: SeatId[] = ["believer", "skeptic", "investor"];

const EMPTY_STATUS: Record<SeatId, Status> = { believer: "waiting", skeptic: "waiting", investor: "waiting", judge: "waiting" };
const STATUS_TEXT: Record<Status, string> = { waiting: "Waiting", thinking: "Thinking...", done: "Done", error: "Error" };

// Small helper: POST some JSON and return the reply, or throw the error message.
async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

export default function IdeaForm() {
  // "State" = values that change while you use the page. When they change,
  // React redraws the page automatically.
  const [idea, setIdea] = useState("");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Record<SeatId, Status>>(EMPTY_STATUS);
  const [texts, setTexts] = useState<Partial<Record<SeatId, string>>>({});
  const [error, setError] = useState<string | null>(null);

  // Update one seat's status/text without wiping the others.
  const setSeatStatus = (seat: SeatId, s: Status) => setStatus((prev) => ({ ...prev, [seat]: s }));
  const setSeatText = (seat: SeatId, t: string) => setTexts((prev) => ({ ...prev, [seat]: t }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page
    setRunning(true);
    setError(null);
    setTexts({});
    setStatus({ ...EMPTY_STATUS, believer: "thinking", skeptic: "thinking", investor: "thinking" });

    try {
      // Round 1: all three seats at once. Promise.all waits for every one.
      // Each answer shows up on the page as soon as it arrives.
      const answers = await Promise.all(
        ARGUING.map(async (seat) => {
          try {
            const data = await postJson("/api/seat", { idea, seat });
            setSeatText(seat, data.argument);
            setSeatStatus(seat, "done");
            return data.argument as string;
          } catch (err) {
            setSeatStatus(seat, "error");
            throw err;
          }
        }),
      );

      // Round 2: the Judge reads all three and decides.
      setSeatStatus("judge", "thinking");
      const [believer, skeptic, investor] = answers;
      const data = await postJson("/api/judge", { idea, arguments: { believer, skeptic, investor } });
      setSeatText("judge", data.verdict);
      setSeatStatus("judge", "done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus((prev) => (prev.judge === "thinking" ? { ...prev, judge: "error" } : prev));
    } finally {
      setRunning(false);
    }
  }

  const started = Object.values(status).some((s) => s !== "waiting");

  return (
    <section className="idea-section">
      <form onSubmit={handleSubmit} className="idea-form">
        <label htmlFor="idea">Your business idea</label>
        <textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. an app that matches dog owners with neighbors who can walk their dog"
          rows={3}
          maxLength={2000}
          required
        />
        <button type="submit" disabled={running || !idea.trim()}>
          {running ? "The council is debating..." : "Convene the council"}
        </button>
      </form>

      {started && (
        <>
          {/* Progress bar: one chip per seat */}
          <div className="progress">
            {SEATS.map((s) => (
              <span key={s.id} className={`chip chip-${status[s.id]}`} style={{ borderColor: s.color }}>
                {s.label.replace("The ", "")}: {STATUS_TEXT[status[s.id]]}
              </span>
            ))}
          </div>
          {running && (
            <p className="muted">
              {status.judge === "thinking"
                ? "The Judge is reading all three arguments. About 1 more minute."
                : "Three seats are arguing at the same time. This takes about 1-2 minutes."}
            </p>
          )}
        </>
      )}

      {error && <p className="error">{error}</p>}

      {/* The Judge's verdict goes first, since that's what you came for */}
      {texts.judge && (
        <article className="answer" style={{ borderTopColor: "var(--judge)" }}>
          <h2>The Judge&apos;s Verdict</h2>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{texts.judge}</ReactMarkdown>
        </article>
      )}

      {/* Then each seat's full argument, folded up so the page isn't huge */}
      {SEATS.filter((s) => s.id !== "judge" && texts[s.id]).map((s) => (
        <details key={s.id} className="answer" style={{ borderTopColor: s.color }} open={!texts.judge}>
          <summary>{s.label}</summary>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{texts[s.id]!}</ReactMarkdown>
        </details>
      ))}
    </section>
  );
}
