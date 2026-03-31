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

## Dataset

- Word corpus: `data/words.json` (170+ entries; `word`, `difficulty` 1–3, `synonyms`).
- Regenerate (optional): `python3 scripts/generate_words.py` (writes `data/words.json`).

---

## Gameplay notes

- **Live guesses** (every ~4s, JPEG snapshot ~384px max edge) are for feedback only; see Route Handlers for prompts.
- **Final guess** uses a stricter one-line prompt; **scoring** uses `score-round` with an in-memory round store so each round is scored at most once server-side.
- If Ollama errors, the UI shows a friendly line in the ticker and continues the round.

