"use client";
// One of the four seat cards. It shows the seat's status (waiting, thinking,
// done) and its score, and you can click it to read what that seat said.

import { Check, AlertTriangle } from "lucide-react";
import PixelAvatar from "@/components/PixelAvatar";
import type { SeatInfo } from "@/lib/seats";
import type { SeatScore } from "@/lib/parse";

export type Status = "idle" | "waiting" | "thinking" | "done" | "error";

const STATUS_TEXT: Record<Status, string> = {
  idle: "",
  waiting: "Waiting for the others",
  thinking: "Thinking",
  done: "Click to read",
  error: "Something went wrong",
};

type Props = {
  seat: SeatInfo;
  status: Status;
  score: SeatScore;
  selected: boolean;
  onSelect: () => void;
};

export default function SeatCard({ seat, status, score, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      className={`seat-card is-${status} ${selected ? "is-selected" : ""}`}
      // A CSS variable, so the stylesheet can color this card with the seat's color.
      style={{ "--seat": seat.color } as React.CSSProperties}
      onClick={onSelect}
      disabled={status !== "done"}
      aria-pressed={selected}
    >
      <div className="seat-top">
        <span className="seat-icon">
          <PixelAvatar seat={seat.id} size={40} />
        </span>
        {status === "done" && score && (
          <span className="seat-score" title={score.label}>
            <small>{score.label}</small>
            {score.value}
            <small>/10</small>
          </span>
        )}
        {status === "done" && !score && <Check className="seat-check" size={20} />}
        {status === "error" && <AlertTriangle className="seat-err" size={20} />}
      </div>
      <h3>{seat.name}</h3>
      <p className="seat-job">{seat.job}</p>
      {status !== "idle" && (
        <p className="seat-status">
          {STATUS_TEXT[status]}
          {status === "thinking" && <span className="dots" aria-hidden />}
        </p>
      )}
    </button>
  );
}
