// The big result at the top: GOOD IDEA / HAS POTENTIAL / BAD IDEA,
// the reason in one sentence, and the two main scores.

import { ThumbsUp, Sparkles, ThumbsDown } from "lucide-react";
import type { Verdict } from "@/lib/parse";

const STYLE = {
  "GOOD IDEA": { className: "good", Icon: ThumbsUp },
  "HAS POTENTIAL": { className: "potential", Icon: Sparkles },
  "BAD IDEA": { className: "bad", Icon: ThumbsDown },
} as const;

export default function VerdictBanner({ verdict, onRead }: { verdict: Verdict; onRead: () => void }) {
  if (!verdict.bottomLine) return null;
  const { className, Icon } = STYLE[verdict.bottomLine];

  return (
    <section className={`verdict ${className}`}>
      <div className="verdict-main">
        <span className="verdict-kicker">The Judge&apos;s verdict</span>
        <h2>
          <Icon size={30} strokeWidth={2.4} /> {verdict.bottomLine}
        </h2>
        {verdict.reason && <p className="verdict-reason">{verdict.reason}</p>}
        <button type="button" className="link-btn" onClick={onRead}>
          Read the full ruling
        </button>
      </div>
      <div className="verdict-stats">
        {verdict.formal && (
          <div className="stat">
            <span>Ruling</span>
            <strong>{verdict.formal}</strong>
          </div>
        )}
        {verdict.feasibility && (
          <div className="stat">
            <span>Feasibility</span>
            <strong>
              {verdict.feasibility}
              <small>/10</small>
            </strong>
          </div>
        )}
        {verdict.value && (
          <div className="stat">
            <span>Value</span>
            <strong>
              {verdict.value}
              <small>/10</small>
            </strong>
          </div>
        )}
      </div>
    </section>
  );
}
