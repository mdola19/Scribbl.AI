/**
 * Cross-platform local setup: Docker Compose + pull vision model.
 * Run: node scripts/local-up.mjs   or   npm run local:setup
 */
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function tryExec(cmd, args) {
  return spawnSync(cmd, args, { stdio: "ignore", shell: true });
}

if (tryExec("docker", ["version"]).status !== 0) {
  console.error("Docker is not available. Install Docker Desktop or Docker Engine + Compose.");
  process.exit(1);
}

console.log("Building and starting containers (first run can take several minutes)...\n");
run("docker", ["compose", "up", "-d", "--build"]);

console.log("\nWaiting for Ollama to accept requests...");
let ready = false;
for (let i = 0; i < 90; i++) {
  const r = tryExec("docker", ["compose", "exec", "-T", "ollama", "ollama", "list"]);
  if (r.status === 0) {
    ready = true;
    break;
  }
  await delay(1000);
}
if (!ready) {
  console.error("Ollama did not become ready in time. Try: docker compose logs ollama");
  process.exit(1);
}

const model = process.env.OLLAMA_MODEL || "llama3.2-vision";
console.log(`\nPulling vision model: ${model} (first time only; large download)...\n`);
run("docker", ["compose", "exec", "-T", "ollama", "ollama", "pull", model]);

console.log("\nDone. Open http://localhost:3000");
console.log("Logs: docker compose logs -f");
console.log("Stop: docker compose down\n");
