# Skribbl.AI

A polished **local** drawing game: you sketch a secret word for two minutes while **Ollama** runs a vision model that peeks at snapshots every few seconds. When time expires, the model makes one **locked** final guess; only that guess affects scoring (**2 / 1 / 0** points for exact / synonym / miss).

Stack: **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**. Game routes live alongside **Route Handlers** that call Ollama server-side — the model never receives the target text, only JPEG snapshots of the canvas.

---

## Quick start (clone → run on localhost)

**Easiest path: Docker only** — you do **not** need Node.js or Ollama installed on your machine; both run in containers.

### 1) Install Docker

- **Mac / Windows:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux:** [Docker Engine](https://docs.docker.com/engine/install/) + [Compose plugin](https://docs.docker.com/compose/install/)

### 2) Clone and start

```bash
git clone <your-repo-url>
cd Scribbl.AI
```

Pick **one** path:

**A — Fully automatic (needs [Node.js](https://nodejs.org/) only to run the helper; Docker does the rest)**

```bash
node scripts/local-up.mjs
```

Or: `npm run local:setup` (same script; no `npm install` required for this).

**B — Docker only (no Node)** — wait until Ollama is up before pulling:

```bash
docker compose up -d --build
docker compose exec ollama ollama pull llama3.2-vision
```

If the second command errors, wait ~30s and retry (Ollama is still starting).

### 3) Open the app

Go to **http://localhost:3000** — `/` is the landing page, `/game` is the game.

### Useful commands

| Command | What it does |
|--------|----------------|
| `docker compose logs -f` | Watch logs |
| `docker compose down` | Stop containers |
| `npm run local:down` | Same as `docker compose down` |

### Troubleshooting

- **Port 3000 in use:** change the left side in `docker-compose.yml` under `web` → `ports` (e.g. `"3001:3000"`) and open `http://localhost:3001`.
- **Windows:** use **Docker Desktop** and run `npm run local:setup` from **PowerShell** or **cmd** (Node.js required only for this helper script). Or manually: `docker compose up -d --build` then `docker compose exec ollama ollama pull llama3.2-vision`.

---

## Alternative: Node on your machine + Ollama on your machine

For **hot reload** while developing the UI, use this instead of Docker.

**Prerequisites:** Node.js **18+**, **npm**, **Ollama** installed locally.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Default Ollama URL is `http://127.0.0.1:11434`.

3. **Run Ollama** (separate terminal): `ollama serve`

4. **Pull a vision model** (once): `ollama pull llama3.2-vision`

5. **Start Next.js:** `npm run dev`

6. Open **http://localhost:3000**

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

## Put it on the internet (visitors only open a URL)

**What “no setup” means for players:** they do **not** install Node, Ollama, or anything else — they just visit your site.

**What you still need as the host:** a small server (VPS) or platform that runs **both** this Next.js app **and** a vision-capable **Ollama** instance the API can reach. The game’s server-side routes call Ollama; browsers never talk to Ollama directly.

### Recommended: one VPS + Docker Compose (simplest mental model)

1. **Rent a VPS** (e.g. DigitalOcean, Hetzner, AWS Lightsail) with enough **RAM** for a vision model (often **8 GB+** depending on model size).
2. **Install Docker** and **Docker Compose** on the server.
3. **Clone this repo** on the server and from the project root run:

   ```bash
   docker compose up -d --build
   ```

4. **Pull a vision model** into the Ollama container (first time only; can take a while):

   ```bash
   docker compose exec ollama ollama pull llama3.2-vision
   ```

5. **Open the app** at `http://YOUR_SERVER_IP:3000` (firewall: allow **TCP 3000**, or put HTTPS in front — see below).

`docker-compose.yml` keeps **Ollama off the public internet** (no port `11434` published). Only the Next.js app is exposed on **3000**; it talks to Ollama on the private Docker network as `http://ollama:11434`.

6. **HTTPS + a proper domain** (strongly recommended): point DNS at the VPS, install **Caddy** or **nginx** on the host, and reverse-proxy to `localhost:3000`. See `deployment/Caddyfile.example` for a minimal Caddy starter.

### Alternative: Vercel (frontend) + Ollama elsewhere

You can deploy the Next.js app to **Vercel**, but **Ollama cannot run inside Vercel’s serverless runtime**. You must run Ollama on another host (Fly.io machine, Railway, GPU VPS, etc.) and set:

- `OLLAMA_BASE_URL` = that server’s base URL (must be reachable from **Vercel’s servers**, not your laptop)

**Security warning:** a public Ollama endpoint without extra protection can be abused. Prefer the **Docker Compose on one VPS** layout so Ollama stays on a private network and only your Next app calls it.

### Environment variables (production)

Set on the platform or in `docker-compose.yml`:

| Variable           | Example (Compose)              |
| ------------------ | ------------------------------ |
| `OLLAMA_BASE_URL`  | `http://ollama:11434` (Compose internal) or your remote Ollama URL |
| `OLLAMA_MODEL`     | `llama3.2-vision`              |

Never commit secrets; use the host’s env UI or Compose `environment:`.

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

- **Live guesses** (every ~4s, JPEG snapshot ~384px max edge) are for feedback only; see Route Handlers for prompts.
- **Final guess** uses a stricter one-line prompt; **scoring** uses `score-round` with an in-memory round store so each round is scored at most once server-side.
- If Ollama errors, the UI shows a friendly line in the ticker and continues the round.

---

## Assumptions baked into this MVP

- **Single Node process:** in-memory `round-store` resets on cold start; fine for a demo, not multi-instance durable.
- **Trust model:** the client displays the secret word; the model is never sent that string — only images.
- **Synonyms** are curator-provided strings; matching uses normalization + token overlap helpers in `lib/scoring.ts`.
- **Branding** in UI is **Skribbl.AI** as requested; repo folder may still read `Scribbl.AI`.

Enjoy the show.
