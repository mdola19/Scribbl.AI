import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-spotlight/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-spotlight/90">
          Live studio challenge
        </p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Skribbl<span className="text-accent-glow">.AI</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-white/70">
          You get a hidden word. Two minutes on the clock. A vision model watches
          your sketch through Ollama and fires live guesses until the buzzer —
          then one final locked answer decides your points.
        </p>
        <ul className="mx-auto mt-8 max-w-md space-y-2 text-left text-sm text-white/60">
          <li className="flex gap-2">
            <span className="text-accent-glow">◆</span>
            Exact final match scores <strong className="text-white">2 pts</strong>;
            synonyms snag <strong className="text-white">1 pt</strong>.
          </li>
          <li className="flex gap-2">
            <span className="text-accent-glow">◆</span>
            Live guesses are theatrics only — only the finale moves the scoreboard.
          </li>
          <li className="flex gap-2">
            <span className="text-accent-glow">◆</span>
            Runs fully local: Next.js frontend + Ollama vision on your machine.
          </li>
        </ul>

        <Link
          href="/game"
          className="mt-10 inline-flex items-center justify-center rounded-2xl bg-accent px-10 py-4 text-base font-semibold text-white shadow-xl shadow-accent/35 transition hover:bg-accent-dim hover:shadow-accent/25"
        >
          Start game
        </Link>

        <p className="mt-8 text-xs text-white/40">
          Tip: pull a vision model first (
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/60">
            llama3.2-vision
          </code>
          ) so the AI booth stays online.
        </p>
      </div>
    </main>
  );
}
