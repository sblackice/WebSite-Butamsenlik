import { formatTRY } from "@/lib/money";

export function AnnouncementBar({ text, freeThreshold }: { text: string; freeThreshold: number }) {
  const items = text.split("|").map((s) => s.trim()).filter(Boolean);
  if (freeThreshold > 0) items.unshift(`${formatTRY(freeThreshold)} ve üzeri siparişlerde ücretsiz kargo`);
  if (!items.length) return null;
  return (
    <div className="bg-ink text-ground">
      <div className="container-x flex min-h-9 items-center justify-center gap-6 overflow-x-auto py-1.5 text-center text-[0.8rem] tracking-wide">
        {items.map((t, i) => (
          <span key={i} className={i > 0 ? "hidden md:inline" : ""}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
