export function getOllamaBaseUrl(): string {
  const raw =
    process.env.OLLAMA_HOST ||
    process.env.OLLAMA_BASE_URL ||
    "http://127.0.0.1:11434";
  return raw.replace(/\/$/, "");
}

export function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL || "llama3.2-vision";
}

export interface OllamaChatResponse {
  message?: { content?: string };
  error?: string;
}

const LIVE_PROMPT =
  "You are playing a drawing guessing game. Look at this sketch and return your single best guess in 1 to 3 words. Explain your thinking briefly (under 15 words) to guide the user";

const FINAL_PROMPT =
  "You are making the final locked guess in a drawing guessing game. Return only one final answer in 1 to 3 words. Do not explain.";

export async function ollamaVisionGuess(
  base64Image: string,
  mode: "live" | "final",
): Promise<{ text: string; ok: boolean; error?: string }> {
  const host = getOllamaBaseUrl();
  const model = getOllamaModel();
  const prompt = mode === "live" ? LIVE_PROMPT : FINAL_PROMPT;

  const rawB64 = base64Image.replace(/^data:image\/\w+;base64,/, "").trim();
  if (!rawB64) {
    return { text: "", ok: false, error: "empty_image" };
  }

  try {
    const res = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: "user",
            content: prompt,
            images: [rawB64],
          },
        ],
      }),
    });

    const data = (await res.json()) as OllamaChatResponse;

    if (!res.ok) {
      const err =
        data?.error ||
        (typeof data === "object" && data !== null && "error" in data
          ? String((data as { error?: unknown }).error)
          : `http_${res.status}`);
      return { text: "", ok: false, error: err };
    }

    const content = data.message?.content?.trim() ?? "";
    return { text: content, ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { text: "", ok: false, error: msg };
  }
}
