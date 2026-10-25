import "server-only";
import { redirect } from "next/navigation";

export function done(path: string, msg: string, kind: "ok" | "err" = "ok"): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(msg)}`);
}

export const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
export const bool = (fd: FormData, k: string) => fd.get(k) === "on";
export const int = (fd: FormData, k: string, min = 0, max = 1_000_000) => {
  const n = Math.trunc(Number(fd.get(k)));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};
