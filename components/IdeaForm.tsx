"use client";
// "use client" means this code runs in the BROWSER, so it can react to typing
// and clicks. It never sees the API key; it just asks our backend (/api/seat).

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SEAT_OPTIONS = [
  { id: "believer", label: "The Believer", color: "var(--believer)" },
  { id: "skeptic", label: "The Skeptic", color: "var(--skeptic)" },
  { id: "investor", label: "The Investor", color: "var(--investor)" },
];

export default function IdeaForm() {
  // "State" = values that change while you use the page. When they change,
  // React redraws the page automatically.
  const [idea, setIdea] = useState("");
  const [seat, setSeat] = useState("believer");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page
    setLoading(true);
    setAnswer(null);
    setError(null);

    try {
      // Send the idea to our backend route from Step 2.
      const res = await fetch("/api/seat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea, seat }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setAnswer(data.argument);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const current = SEAT_OPTIONS.find((s) => s.id === seat)!;

  return (
    <section className="idea-section">
      <form onSubmit={handleSubmit} className="idea-form">
        <label htmlFor="idea">Your business idea</label>
        <textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. an app that matches dog owners with neighbors who can walk their dog"
          rows={3}
          maxLength={2000}
          required
        />
        <div className="form-row">
          <select value={seat} onChange={(e) => setSeat(e.target.value)} disabled={loading}>
            {SEAT_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                Ask {s.label}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading || !idea.trim()}>
            {loading ? "Thinking..." : "Send to the council"}
          </button>
        </div>
      </form>

      {loading && (
        <p className="muted">{current.label} is writing its argument. This takes about 30-90 seconds.</p>
      )}

      {error && <p className="error">{error}</p>}

      {answer && (
        <article className="answer" style={{ borderTopColor: current.color }}>
          <h2>{current.label}</h2>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
        </article>
      )}
    </section>
  );
}
