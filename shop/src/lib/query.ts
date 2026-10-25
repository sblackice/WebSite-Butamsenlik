// Builds listing URLs while keeping the current filters.
export type QueryValue = string | string[] | undefined | null;

export function buildHref(path: string, params: Record<string, QueryValue>, overrides: Record<string, QueryValue> = {}) {
  const merged = { ...params, ...overrides };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v == null || v === "") continue;
    if (Array.isArray(v)) v.forEach((x) => x && sp.append(k, x));
    else sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `${path}?${s}` : path;
}
