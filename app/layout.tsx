import type { ReactNode } from "react";
// Fonts are bundled with the app (no internet needed when it runs):
// Silkscreen = the pixel font for titles, Inter = the easy-to-read font for text.
import "@fontsource/silkscreen/400.css";
import "@fontsource/silkscreen/700.css";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata = {
  title: "The Council",
  description: "Four AI advisors debate your business idea and deliver a verdict.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
