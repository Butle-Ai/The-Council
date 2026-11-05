// Everything the page needs to know about each seat: name, job, color, icon.
// Keeping it in one place means changing a color here changes it everywhere.

import { Lightbulb, ShieldAlert, TrendingUp, Scale, type LucideIcon } from "lucide-react";

export type SeatId = "believer" | "skeptic" | "investor" | "judge";

export type SeatInfo = {
  id: SeatId;
  name: string;
  job: string;
  color: string;
  Icon: LucideIcon;
};

export const SEAT_INFO: SeatInfo[] = [
  { id: "believer", name: "The Believer", job: "Builds the best case and finds who would buy it.", color: "#3fb97a", Icon: Lightbulb },
  { id: "skeptic", name: "The Skeptic", job: "Attacks the idea and finds why it would fail.", color: "#ef5b52", Icon: ShieldAlert },
  { id: "investor", name: "The Investor", job: "Checks the numbers: is it worth the money?", color: "#e9ad3c", Icon: TrendingUp },
  { id: "judge", name: "The Judge", job: "Weighs every argument and delivers the verdict.", color: "#8b97ff", Icon: Scale },
];
