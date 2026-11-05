# The Council

Type in a business idea. Four AI advisors debate it, and a Judge tells you if it's a **good idea**, **has potential**, or is a **bad idea**.

| Seat | Job |
|---|---|
| 🟢 The Believer | Builds the strongest best case and figures out who would buy it. |
| 🔴 The Skeptic | Attacks the idea: why it would fail, who won't buy, who it loses to. |
| 🟡 The Investor | Checks the numbers: market size, costs, profit, and whether it's feasible. |
| 🔵 The Judge | Reads every argument, rules on each disagreement, and gives the final verdict. |

## Inspiration

This is a remix of [LLM Council](https://github.com/karpathy/llm-council) by Andrej Karpathy, where several AI models answer a question, review each other, and a "chairman" writes the final answer.

**What's different here:** instead of the same job for every model, each seat has a specific *role* (believer, skeptic, investor, judge). There's also a rebuttal round where the seats respond to each other before the Judge decides. The whole thing is built for one use: testing whether a business idea is worth pursuing.

## Build plan

We're building this one step at a time.

- [x] **Step 1: Skeleton.** Next.js app, homepage, and the four seat prompts in `prompts/`.
- [x] **Step 2: First AI call.** A backend route that sends an idea to one seat (the Believer) using the Claude API.
- [x] **Step 3: The idea form.** A text box on the homepage that sends your idea and shows the answer.
- [x] **Step 4: The full council.** Believer, Skeptic and Investor run at the same time, then the Judge.
- [ ] **Step 5: Rebuttal round.** Each seat reads the others and fires back before the Judge rules.
- [ ] **Step 6: Live streaming.** Watch each seat "type" its argument live instead of waiting.
- [x] **Step 7: Redesign and verdict card.** Pixel-art characters for each seat that clash in an arena while they argue, a pixel font, and a starry background. Also: clickable seat cards with scores, a big verdict banner, and a "See an example" button that loads a saved council (no API credits used).
- [ ] **Step 8: Save and share.** Keep past verdicts and share a link to one.
- [ ] **Step 9: Deploy.** Put it online (Vercel) so anyone can use it.

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
cp .env.example .env.local   # then paste your Anthropic API key inside
npm run dev
```

Open http://localhost:3000.

### Test one seat from the terminal (Step 2)

With `npm run dev` running, open a second terminal and run:

```bash
curl -X POST http://localhost:3000/api/seat -H "content-type: application/json" -d '{"seat":"believer","idea":"an app that matches dog owners with neighbors who can walk their dog"}'
```

Change `"believer"` to `"skeptic"` or `"investor"` to hear from a different seat. It takes about 30-90 seconds.

## Project layout

```
app/              the website (pages and styles)
app/api/seat/     backend route: takes an idea, returns one seat's argument
app/api/judge/    backend route: takes all three arguments, returns the verdict
components/       pieces of the page (Council, Arena, SeatCard, VerdictBanner, PixelAvatar)
lib/council.ts    the code that talks to Claude
lib/errors.ts     turns errors into plain-English messages
lib/parse.ts      pulls scores and the verdict out of each answer
lib/seats.ts      each seat's name, job, and color
lib/sprites.ts    the pixel-art characters, drawn one pixel at a time
lib/example.json  a saved council run (Grey Hair Academy) for the demo button
prompts/          the instructions that give each seat its personality
```
