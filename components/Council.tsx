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
            const data = await postJson("/api/seat", { idea, seat, mode });
            setSeatText(seat, data.argument);
            setSeatStatus(seat, "done");
            // Show the first answer that comes back, so there's something to read.
            setSelected((cur) => cur ?? seat);
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
      const data = await postJson("/api/judge", { idea, mode, arguments: { believer, skeptic, investor } });
      setSeatText("judge", data.verdict);
      setSeatStatus("judge", "done");
      setSelected("judge");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus((prev) => (prev.judge === "thinking" ? { ...prev, judge: "error" } : prev));
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

  const verdict = texts.judge ? parseVerdict(texts.judge) : null;
  const selectedSeat = SEAT_INFO.find((s) => s.id === selected);
  const selectedText = selected ? texts[selected] : undefined;

  // Which scene the arena should show.
  const phase: Phase =
    status.judge === "done"
      ? "done"
      : status.judge === "thinking"
        ? "judging"
        : ARGUING.some((s) => status[s] === "thinking")
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
        canOpen={(seat) => status[seat] === "done"}
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
          {status.judge === "thinking"
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
