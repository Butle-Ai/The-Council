// The homepage: a header, then the Council (form, seat cards, results).
import Council from "@/components/Council";

export default function Home() {
  return (
    <main>
      <header className="hero">
        <span className="badge">4 AI advisors · 1 verdict</span>
        <h1>The Council</h1>
        <p>
          Pitch a business idea. A Believer, a Skeptic and an Investor argue about it, and a Judge decides if it&apos;s
          worth your time.
        </p>
      </header>
      <Council />
      <footer className="footer">
        Inspired by Andrej Karpathy&apos;s{" "}
        <a href="https://github.com/karpathy/llm-council" target="_blank" rel="noreferrer">
          LLM Council
        </a>
        . Powered by Claude.
      </footer>
    </main>
  );
}
