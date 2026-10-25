// Turkish-aware text helpers for search and URLs.

const MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

export function normalizeSearch(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // drops the dot of "i̇" and other marks
    .replace(/[çğıöşüâîû]/g, (c) => MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugify(input: string): string {
  return normalizeSearch(input).replace(/\s+/g, "-").slice(0, 80);
}

export function buildSearchText(parts: (string | null | undefined)[]): string {
  return normalizeSearch(parts.filter(Boolean).join(" "));
}
