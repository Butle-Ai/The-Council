import type { ReactNode } from "react";
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
