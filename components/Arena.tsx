"use client";
// The "arena": the four pixel characters on a little stage.
// - Before you start, they idle and bounce.
// - While the three seats argue, they lunge at each other and sparks fly.
// - While the Judge thinks, the Judge bangs the gavel.
// - When it's done, the Judge announces the verdict and the winning side celebrates.

import { useEffect, useState } from "react";
import PixelAvatar from "@/components/PixelAvatar";
import type { SeatId } from "@/lib/seats";
import type { BottomLine } from "@/lib/parse";

export type Phase = "idle" | "arguing" | "judging" | "done";

const LINES: Record<SeatId, string[]> = {
  believer: ["People would LOVE this!", "Think of the customers!", "This could be huge!", "I'd buy it today!"],
  skeptic: ["Who would actually pay?", "That won't work.", "Competitors exist...", "Prove it."],
  investor: ["Show me the numbers.", "What does it cost?", "Is it worth the $?", "Margins look... hm."],
  judge: ["Order! Order!", "Weighing the evidence...", "Hmm...", "Let me think."],
};

// Who celebrates at the end depends on the verdict.
const WINNER: Record<BottomLine, SeatId> = {
  "GOOD IDEA": "believer",
  "HAS POTENTIAL": "investor",
  "BAD IDEA": "skeptic",
};

type Props = {
  phase: Phase;
  bottomLine: BottomLine | null;
  canOpen: (seat: SeatId) => boolean;
  onOpen: (seat: SeatId) => void;
};

export default function Arena({ phase, bottomLine, canOpen, onOpen }: Props) {
  // A counter that ticks every 2 seconds, used to rotate the speech bubbles.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (phase !== "arguing" && phase !== "judging") return;
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, [phase]);

  const winner = phase === "done" && bottomLine ? WINNER[bottomLine] : null;

  function bubble(seat: SeatId): string | null {
    if (phase === "arguing" && seat !== "judge") {
      // Stagger who's talking so they don't all speak at once.
      const offset = { believer: 0, investor: 1, skeptic: 2 }[seat as "believer" | "investor" | "skeptic"];
      return (tick + offset) % 3 === 0 || (tick + offset) % 3 === 1 ? LINES[seat][(tick + offset) % 4] : null;
    }
    if (phase === "judging" && seat === "judge") return LINES.judge[tick % 4];
    if (phase === "done" && seat === "judge" && bottomLine) return `${bottomLine}!`;
    if (phase === "idle" && seat === "judge") return "The council is ready.";
    return null;
  }

  // A plain function (not a component) so React keeps the same elements between
  // ticks and the animations don't restart every time a bubble changes.
  function fighter(seat: SeatId, flip = false) {
    const text = bubble(seat);
    const clickable = canOpen(seat);
    return (
      <button
        type="button"
        className={`fighter fighter-${seat} ${winner === seat ? "is-winner" : ""}`}
        onClick={() => clickable && onOpen(seat)}
        disabled={!clickable}
        title={clickable ? "Click to read" : undefined}
      >
        {text && <span className="bubble">{text}</span>}
        <PixelAvatar seat={seat} size={88} flip={flip} />
        <span className="fighter-shadow" />
      </button>
    );
  }

  return (
    <div className={`arena phase-${phase}`}>
      <div className="arena-bench">
        {fighter("judge")}
        <div className="bench" />
        {phase === "judging" && <span className="bang">BANG!</span>}
      </div>

      <div className="arena-floor">
        {fighter("believer")}
        <span className="spark spark-left" aria-hidden />
        {fighter("investor")}
        <span className="spark spark-right" aria-hidden />
        {fighter("skeptic", true)}
      </div>
    </div>
  );
}
