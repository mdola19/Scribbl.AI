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
  message?: { content?: string | unknown };
  error?: string;
}

function extractMessageText(data: OllamaChatResponse): string {
  const raw = data.message?.content;
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) {
    return raw
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: string }).text ?? "");
        }
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

const LIVE_PROMPT =
  "You are playing a drawing guessing game. Return best guess in 1-3 words, then an explanation in exactly 5-6 words.";

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

  /** Shorter generations = faster responses; prompts already ask for brief text */
  const options =
    mode === "live"
      ? { num_predict: 64, temperature: 0.35 }
      : { num_predict: 24, temperature: 0.25 };

  try {
    const res = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        options,
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

    const content = extractMessageText(data);
    return { text: content, ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { text: "", ok: false, error: msg };
  }
}
