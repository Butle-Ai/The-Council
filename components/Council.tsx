"use client";
// The main part of the page. It holds all the "state" (the idea, each seat's
// status and answer, which seat you clicked) and runs the council:
//   1. Believer, Skeptic and Investor all get the idea AT THE SAME TIME
//      (3 calls to /api/seat in parallel), so no seat sees the others' work.
//   2. When all three are done, their arguments go to the Judge (/api/judge).

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Gavel, PlayCircle, Zap, Rocket } from "lucide-react";
import SeatCard, { type Status } from "@/components/SeatCard";
import VerdictBanner from "@/components/VerdictBanner";
import Arena, { type Phase } from "@/components/Arena";
import PixelAvatar from "@/components/PixelAvatar";
import { SEAT_INFO, type SeatId } from "@/lib/seats";
import { seatScore, parseVerdict } from "@/lib/parse";
import example from "@/lib/example.json";

const ARGUING: SeatId[] = ["believer", "skeptic", "investor"];
const ALL_IDLE: Record<SeatId, Status> = { believer: "idle", skeptic: "idle", investor: "idle", judge: "idle" };

type Mode = "side-hustle" | "venture";

// The two modes you can pick. Each one makes the seats judge the idea differently.
const MODES: { id: Mode; label: string; blurb: string; Icon: typeof Zap }[] = [
  { id: "side-hustle", label: "Side hustle", blurb: "Quick money, weeks to start, part time", Icon: Zap },
  { id: "venture", label: "Long-term venture", blurb: "Years of work, big upside, maybe investors", Icon: Rocket },
];

const SAMPLE_IDEAS: Record<Mode, string[]> = {
  "side-hustle": [
    "Reselling thrifted vintage clothes on Depop",
    "Washing and detailing cars in my neighborhood on weekends",
    "Making custom Canva templates and selling them on Etsy",
  ],
  venture: [
    "A subscription box of local snacks for people who moved abroad",
    "An app that matches dog owners with neighbors who can walk their dog",
    "AI tutor that helps high school students study for tests using their own notes",
  ],
};

// Send a request and read the LIVE answer as it streams in (see lib/live.ts).
// onSearching / onText fire while the seat works; it returns the final text.
async function streamSeat(
  url: string,
  body: unknown,
  onSearching: () => void,
  onText: (textSoFar: string) => void,
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    // Errors before the stream starts (like a missing idea) come back as JSON.
    const raw = await res.text();
    let message = `Request failed (${res.status}).`;
    try {
      message = JSON.parse(raw).error ?? message;
    } catch {}
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let soFar = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop()!; // keep any half-finished line for next time
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line);
      if (msg.type === "searching") onSearching();
      if (msg.type === "text") {
        soFar += msg.text;
        onText(soFar);
      }
      if (msg.type === "error") throw new Error(msg.error);
      if (msg.type === "done") return msg.text as string;
    }
  }
  throw new Error("The connection dropped before the council finished. Try again.");
}

export default function Council() {
  const [idea, setIdea] = useState("");
  const [mode, setMode] = useState<Mode>("side-hustle");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Record<SeatId, Status>>(ALL_IDLE);
  const [texts, setTexts] = useState<Partial<Record<SeatId, string>>>({});
  const [selected, setSelected] = useState<SeatId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExample, setIsExample] = useState(false);
  const readerRef = useRef<HTMLElement>(null);

  const setSeatStatus = (seat: SeatId, s: Status) => setStatus((prev) => ({ ...prev, [seat]: s }));
  const setSeatText = (seat: SeatId, t: string) => setTexts((prev) => ({ ...prev, [seat]: t }));

  // Open a seat's argument and scroll down to it.
  function openSeat(seat: SeatId) {
    setSelected(seat);
    setTimeout(() => readerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page
    setRunning(true);
    setIsExample(false);
    setError(null);
    setTexts({});
    setSelected(null);
    setStatus({ believer: "thinking", skeptic: "thinking", investor: "thinking", judge: "waiting" });

    try {
      // Round 1: all three seats at once. Promise.all waits for every one.
      const answers = await Promise.all(
        ARGUING.map(async (seat) => {
          try {
            const text = await streamSeat(
              "/api/seat",
              { idea, seat, mode },
              () => setSeatStatus(seat, "searching"),
              (soFar) => {
                setSeatText(seat, soFar);
                setSeatStatus(seat, "writing");
                // Show the first seat that starts writing, so there's something to watch.
                setSelected((cur) => cur ?? seat);
              },
            );
            setSeatText(seat, text);
            setSeatStatus(seat, "done");
            return text;
          } catch (err) {
            setSeatStatus(seat, "error");
            throw err;
          }
        }),
      );

      // Round 2: the Judge reads all three and decides.
      setSeatStatus("judge", "thinking");
      const [believer, skeptic, investor] = answers;
      setSelected("judge");
      const verdictText = await streamSeat(
        "/api/judge",
        { idea, mode, arguments: { believer, skeptic, investor } },
        () => setSeatStatus("judge", "searching"),
        (soFar) => {
          setSeatText("judge", soFar);
          setSeatStatus("judge", "writing");
        },
      );
      setSeatText("judge", verdictText);
      setSeatStatus("judge", "done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus((prev) => (["thinking", "searching", "writing"].includes(prev.judge) ? { ...prev, judge: "error" } : prev));
    } finally {
      setRunning(false);
    }
  }

  // Load a saved council (Grey Hair Academy) so you can see the design
  // without spending API credits. Great for demos.
  function loadExample() {
    setIdea(example.idea);
    setMode("venture"); // the saved example was judged as a long-term venture
    setIsExample(true);
    setError(null);
    setTexts({ believer: example.believer, skeptic: example.skeptic, investor: example.investor, judge: example.judge });
    setStatus({ believer: "done", skeptic: "done", investor: "done", judge: "done" });
    setSelected("judge");
  }

  // Only show the verdict banner once the Judge has completely finished.
  const verdict = texts.judge && status.judge === "done" ? parseVerdict(texts.judge) : null;
  const busy = (s: Status) => s === "thinking" || s === "searching" || s === "writing";
  const selectedSeat = SEAT_INFO.find((s) => s.id === selected);
  const selectedText = selected ? texts[selected] : undefined;

  // Which scene the arena should show.
  const phase: Phase =
    status.judge === "done"
      ? "done"
      : busy(status.judge)
        ? "judging"
        : ARGUING.some((s) => busy(status[s]))
          ? "arguing"
          : "idle";

  return (
    <>
      <form onSubmit={handleSubmit} className="idea-card">
        <span className="field-label">What kind of idea is it?</span>
        <div className="mode-toggle" role="radiogroup" aria-label="Idea type">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              className={`mode-option ${mode === m.id ? "is-active" : ""}`}
              onClick={() => setMode(m.id)}
              disabled={running}
            >
              <m.Icon size={20} />
              <span>
                <strong>{m.label}</strong>
                <small>{m.blurb}</small>
              </span>
            </button>
          ))}
        </div>

        <label htmlFor="idea">What&apos;s your idea?</label>
        <textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Describe it in a sentence or two. No budget or plan needed."
          rows={3}
          maxLength={2000}
          required
        />
        <div className="samples">
          <span>Try:</span>
          {SAMPLE_IDEAS[mode].map((s) => (
            <button key={s} type="button" className="sample" onClick={() => setIdea(s)} disabled={running}>
              {s}
            </button>
          ))}
        </div>
        <div className="idea-actions">
          <button type="submit" className="primary" disabled={running || !idea.trim()}>
            <Gavel size={18} /> {running ? "The council is debating..." : "Convene the council"}
          </button>
          <button type="button" className="ghost" onClick={loadExample} disabled={running}>
            <PlayCircle size={18} /> See an example
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <Arena
        phase={phase}
        bottomLine={verdict?.bottomLine ?? null}
        canOpen={(seat) => Boolean(texts[seat])}
        onOpen={openSeat}
      />

      {verdict && <VerdictBanner verdict={verdict} onRead={() => openSeat("judge")} />}
      {isExample && <p className="muted center">This is a saved example, so it didn&apos;t use any API credits.</p>}

      <div className="council-grid">
        {SEAT_INFO.map((seat) => (
          <SeatCard
            key={seat.id}
            seat={seat}
            status={status[seat.id]}
            score={texts[seat.id] ? seatScore(seat.id, texts[seat.id]!) : null}
            selected={selected === seat.id}
            onSelect={() => openSeat(seat.id)}
          />
        ))}
      </div>

      {running && (
        <p className="muted center">
          {busy(status.judge)
            ? "The Judge is reading all three arguments and checking the facts. About 1-3 more minutes."
            : "The seats are thinking deeply and researching online at the same time. This takes about 2-5 minutes. Click a seat when it's done."}
        </p>
      )}

      {selectedSeat && selectedText && (
        <article ref={readerRef} className="reader" style={{ "--seat": selectedSeat.color } as React.CSSProperties}>
          <header>
            <span className="seat-icon">
              <PixelAvatar seat={selectedSeat.id} size={44} />
            </span>
            <div>
              <h2>{selectedSeat.name}</h2>
              <p>{selectedSeat.job}</p>
            </div>
          </header>
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedText}</ReactMarkdown>
          </div>
        </article>
      )}
    </>
  );
}
