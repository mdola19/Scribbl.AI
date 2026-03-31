# Skribbl.AI

A polished **local** drawing game: you sketch a secret word for two minutes while **Ollama** runs a vision model that peeks at snapshots every few seconds. When time expires, the model makes one **locked** final guess; only that guess affects scoring (**2 / 1 / 0** points for exact / synonym / miss).

Stack: **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**. Game routes live alongside **Route Handlers** that call Ollama server-side — the model never receives the target text, only JPEG snapshots of the canvas.

---

## Prerequisites

- **Node.js 18.18+** (or 20+) and npm
- **Ollama** installed and running where your Next server can reach it
- A **vision** model pulled in Ollama, e.g. `llama3.2-vision`

---

## Quick start (local)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` if Ollama is not on `http://127.0.0.1:11434` or if you use another model name.

3. **Run Ollama** (in a separate terminal)

   ```bash
   ollama serve
   ```

4. **Pull a vision model** (once per machine)

   ```bash
   ollama pull llama3.2-vision
   ```

5. **Start Next.js**

   ```bash
   npm run dev
   ```

6. Open **http://localhost:3000** — landing at `/`, game at `/game`.

---

## Scripts & tests

| Command        | Description                |
| -------------- | -------------------------- |
| `npm run dev`  | Development server         |
| `npm run build` / `npm start` | Production build & run |
| `npm run lint` | ESLint                     |
| `npm test`     | Vitest (normalize, scoring, word pick) |

---

## Dataset

- Word corpus: `data/words.json` (170+ entries; `word`, `difficulty` 1–3, `synonyms`).
- Regenerate (optional): `python3 scripts/generate_words.py` (writes `data/words.json`).

---

## Project layout (high level)

```text
app/
  layout.tsx, globals.css, page.tsx
  game/
    layout.tsx      # wraps GameProvider
    page.tsx        # main round + canvas + polling
    end/page.tsx    # totals / restart links
  api/game/
    start-round/route.ts
    live-guess/route.ts
    final-guess/route.ts
    score-round/route.ts
components/         # canvas, modal, panels, sliders
context/            # GameContext (score, difficulty, used words)
lib/                # Ollama client, scoring, normalize, round store, canvas utils
data/words.json
types/game.ts
```

---

## Deployment & public URL

This is a normal Next.js app: you can deploy to **Vercel**, **Railway**, a **VPS**, etc.

**Important:** API routes must be able to **`fetch` your Ollama instance**. On Vercel’s cloud, `http://127.0.0.1:11434` points to the server itself, not your laptop. Practical options:

- Run **both** Next and Ollama on the **same host** (VM/VPS/Docker) and set `OLLAMA_BASE_URL` to that host (e.g. `http://127.0.0.1:11434` on the server).
- Or expose Ollama over a **private network / tunnel** your Next deployment can reach, then set `OLLAMA_BASE_URL` accordingly.

Never commit real secrets; use the host’s env UI or platform env vars for `OLLAMA_BASE_URL` and `OLLAMA_MODEL`.

---

## Environment variables

| Variable           | Description                                      | Default                    |
| ------------------ | ------------------------------------------------ | -------------------------- |
| `OLLAMA_BASE_URL`  | Ollama HTTP root (no trailing slash)             | `http://127.0.0.1:11434`   |
| `OLLAMA_HOST`      | Same as above (alias)                            | same as default            |
| `OLLAMA_MODEL`     | Vision model name in Ollama                      | `llama3.2-vision`         |

Copy from `.env.example` into `.env.local` for local development.

---

## Gameplay notes

- **Live guesses** (every ~4s, JPEG snapshot ~512px max edge) are for feedback only; see Route Handlers for prompts.
- **Final guess** uses a stricter one-line prompt; **scoring** uses `score-round` with an in-memory round store so each round is scored at most once server-side.
- If Ollama errors, the UI shows a friendly line in the ticker and continues the round.

---

## Assumptions baked into this MVP

- **Single Node process:** in-memory `round-store` resets on cold start; fine for a demo, not multi-instance durable.
- **Trust model:** the client displays the secret word; the model is never sent that string — only images.
- **Synonyms** are curator-provided strings; matching uses normalization + token overlap helpers in `lib/scoring.ts`.
- **Branding** in UI is **Skribbl.AI** as requested; repo folder may still read `Scribbl.AI`.

Enjoy the show.
