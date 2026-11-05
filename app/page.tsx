// The homepage: a title, the four seat cards, and the idea form.
import IdeaForm from "@/components/IdeaForm";

const seats = [
  { name: "The Believer", color: "var(--believer)", job: "Builds the best case and finds who would buy it." },
  { name: "The Skeptic", color: "var(--skeptic)", job: "Attacks the idea and finds why it would fail." },
  { name: "The Investor", color: "var(--investor)", job: "Checks the numbers: is it worth the money?" },
  { name: "The Judge", color: "var(--judge)", job: "Weighs everything and delivers the verdict." },
];

export default function Home() {
  return (
    <main>
      <h1>The Council</h1>
      <p className="muted">Four AI advisors debate your business idea. You get a verdict.</p>
      <div className="seats">
        {seats.map((s) => (
          <div key={s.name} className="seat" style={{ borderTopColor: s.color }}>
            <h3>{s.name}</h3>
            <p>{s.job}</p>
          </div>
        ))}
      </div>
      <IdeaForm />
    </main>
  );
}
