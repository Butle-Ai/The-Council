// Everything the page needs to know about each seat: name, job, and color.
// (Their pixel characters live in lib/sprites.ts.)
// Keeping it in one place means changing a color here changes it everywhere.

export type SeatId = "believer" | "skeptic" | "investor" | "judge";

export type SeatInfo = {
  id: SeatId;
  name: string;
  job: string;
  color: string;
};

export const SEAT_INFO: SeatInfo[] = [
  { id: "believer", name: "The Believer", job: "Builds the best case and finds who would buy it.", color: "#3fb97a" },
  { id: "skeptic", name: "The Skeptic", job: "Attacks the idea and finds why it would fail.", color: "#ef5b52" },
  { id: "investor", name: "The Investor", job: "Checks the numbers: is it worth the money?", color: "#e9ad3c" },
  { id: "judge", name: "The Judge", job: "Weighs every argument and delivers the verdict.", color: "#9b7bff" },
];
