// Pulls the important numbers out of each seat's written answer so the page
// can show them as badges. Claude writes these lines because the prompts in
// prompts/ ask for them, e.g. "Believer's confidence: 7/10".
// If a pattern isn't found we just return null and the badge is hidden.

function findScore(text: string, label: RegExp): string | null {
  // label, then anything up to 30 characters, then a number like 7 or 7.5, then "/10"
  const match = text.match(new RegExp(label.source + "[^\\n]{0,30}?(\\d+(?:\\.\\d+)?)\\s*/\\s*10", "i"));
  return match ? match[1] : null;
}

export type SeatScore = { label: string; value: string } | null;

export function seatScore(seat: string, text: string): SeatScore {
  if (seat === "believer") {
    const v = findScore(text, /confidence/);
    return v ? { label: "Confidence", value: v } : null;
  }
  if (seat === "skeptic") {
    const v = findScore(text, /risk rating/);
    return v ? { label: "Risk", value: v } : null;
  }
  if (seat === "investor") {
    const v = findScore(text, /feasibility score/);
    return v ? { label: "Feasibility", value: v } : null;
  }
  if (seat === "judge") {
    const v = findScore(text, /value/);
    return v ? { label: "Value", value: v } : null;
  }
  return null;
}

export type BottomLine = "GOOD IDEA" | "HAS POTENTIAL" | "BAD IDEA";

export type Verdict = {
  bottomLine: BottomLine | null;
  reason: string | null;
  formal: string | null; // GREENLIGHT / PROCEED WITH CONDITIONS / PIVOT / REJECT
  feasibility: string | null;
  value: string | null;
};

export function parseVerdict(text: string): Verdict {
  const bottom = text.match(/(GOOD IDEA|HAS POTENTIAL|BAD IDEA)/);
  // The reason is the rest of that line, with markdown stars and dots cleaned off.
  let reason: string | null = null;
  if (bottom) {
    const line = text.slice(bottom.index!).split("\n")[0];
    reason = line.slice(bottom[0].length).replace(/[*_]/g, "").replace(/^[\s.:\-]+/, "").trim() || null;
  }
  const formal = text.match(/(GREENLIGHT|PROCEED WITH CONDITIONS|PIVOT|REJECT)/);
  return {
    bottomLine: (bottom?.[1] as BottomLine) ?? null,
    reason,
    formal: formal?.[1] ?? null,
    feasibility: findScore(text, /feasibility/),
    value: findScore(text, /value/),
  };
}
