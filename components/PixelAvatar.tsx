// Draws a seat's pixel character as an SVG. Each pixel is one tiny square,
// and "crispEdges" keeps them sharp instead of blurry when scaled up.

import { SPRITES } from "@/lib/sprites";
import type { SeatId } from "@/lib/seats";

type Props = {
  seat: SeatId;
  size?: number;
  flip?: boolean; // mirror left/right, so two characters can face each other
  className?: string;
};

export default function PixelAvatar({ seat, size = 48, flip = false, className = "" }: Props) {
  const { rows, palette } = SPRITES[seat];
  const pixels: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      const fill = palette[ch as keyof typeof palette];
      pixels.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />);
    });
  });

  return (
    <svg
      className={`pixel-avatar ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
    >
      {pixels}
    </svg>
  );
}
