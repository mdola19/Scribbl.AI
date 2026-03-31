/**
 * Normalize for comparison: lowercase, trim, collapse whitespace,
 * strip common punctuation, keep internal letters/digits.
 */
export function normalizeGuess(input: string): string {
  if (!input || typeof input !== "string") return "";
  let s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");

  s = s.replace(/[._\-/\\|,;:]+/g, " ");
  s = s.replace(/[''"''"]/g, "");
  s = s.replace(/[!?*.]+$/g, "");
  s = s.replace(/\s+/g, " ").trim();

  return s;
}
